import ServiceInventory from '../models/ServiceInventory.js';
import Booking from '../models/Booking.js';
import OwnerApplication from '../models/OwnerApplication.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { PayOS } from '@payos/node';
import { sendNotification } from '../utils/notificationHelper.js';

// Hàm helper tính toán mảng ngày để hoàn kho
const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    while (currentDate < end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// 👉 API: POST /api/payments/create-link
export const createPaymentLink = async (req, res, next) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user._id;

        // 1. Kiểm tra tính hợp lệ của đơn hàng
        const booking = await Booking.findOne({ _id: bookingId, userId });
        if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt phòng hợp lệ.');
        if (booking.status !== 'PENDING') throw new ApiError(400, 'Đơn hàng này không ở trạng thái chờ thanh toán.');

        // 2. Truy xuất API Key của Chủ dịch vụ (Owner)
        // Dùng .select() để lấy các trường bảo mật (select: false) và .lean() để bypass Mongoose Strict Mode
        const ownerApp = await OwnerApplication.findOne({
            userId: booking.ownerId,
            status: 'APPROVED'
        })
            .select('+payos.clientId +payos.apiKey +payos.checksumKey')
            .lean();

        if (!ownerApp || !ownerApp.payos || !ownerApp.payos.clientId) {
            throw new ApiError(400, 'Rất tiếc! Chủ dịch vụ chưa cấu hình cổng thanh toán.');
        }

        const { clientId, apiKey, checksumKey } = ownerApp.payos;

        // 3. Khởi tạo PayOS Client (Bản v2 yêu cầu truyền tham số dạng Object)
        const payos = new PayOS({ clientId, apiKey, checksumKey });

        // 4. Tạo mã đơn hàng duy nhất cho PayOS (Yêu cầu số nguyên)
        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

        // Lưu transactionId vào DB để đối soát khi Client/Webhook gọi xác thực
        booking.paymentDetails = { transactionId: String(payosOrderCode) };
        await booking.save();

        // 5. Cấu hình dữ liệu thanh toán gửi sang PayOS
        const YOUR_DOMAIN = process.env.CLIENT_URL || 'http://localhost:5173';

        // Làm sạch mã đơn hàng (giữ lại chữ/số, cắt tối đa 25 ký tự) tránh lỗi từ PayOS
        const safeBookingCode = booking.bookingCode.replace(/[^a-zA-Z0-9]/g, '');

        const requestData = {
            orderCode: payosOrderCode,
            amount: booking.bookingDetails.totalPrice,
            description: `TT ${safeBookingCode}`.substring(0, 25),
            cancelUrl: `${YOUR_DOMAIN}/payment/cancel/${booking._id}?serviceId=${booking.serviceId}`,
            returnUrl: `${YOUR_DOMAIN}/payment/success/${booking._id}?serviceId=${booking.serviceId}`,
        };

        // 6. Gửi request tạo link thanh toán
        const paymentLinkData = await payos.paymentRequests.create(requestData);

        return ApiResponse.send(res, 200, 'Tạo link thanh toán thành công', {
            checkoutUrl: paymentLinkData.checkoutUrl
        });

    } catch (error) {
        // Xử lý lỗi trả về trực tiếp từ API của PayOS (nếu có)
        if (error.response?.data) {
            console.error('Lỗi từ PayOS:', error.response.data);
            return next(new ApiError(400, 'Lỗi cổng thanh toán: ' + error.response.data.desc));
        }
        next(error);
    }
};

// 👉 API: GET /api/payments/verify/:bookingId
export const verifyPayment = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // 1. Tìm đơn hàng cần xác thực
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new ApiError(404, 'Không tìm thấy đơn hàng.');

        // 2. Chống Idempotency (Tránh gọi sang PayOS nhiều lần nếu đơn đã xác nhận thành công trước đó)
        if (booking.status === 'PAID') {
            return ApiResponse.send(res, 200, 'Đơn hàng đã được thanh toán (đã lưu DB).', { status: 'PAID' });
        }

        // 3. Truy xuất lại chìa khóa PayOS của Owner
        const ownerApp = await OwnerApplication.findOne({
            userId: booking.ownerId,
            status: 'APPROVED'
        })
            .select('+payos.clientId +payos.apiKey +payos.checksumKey')
            .lean();

        if (!ownerApp || !ownerApp.payos || !ownerApp.payos.clientId) {
            throw new ApiError(400, 'Dữ liệu cổng thanh toán của chủ dịch vụ bị lỗi.');
        }

        const { clientId, apiKey, checksumKey } = ownerApp.payos;

        // 4. Khởi tạo lại PayOS Client
        const payos = new PayOS({ clientId, apiKey, checksumKey });

        // Lấy mã giao dịch (số nguyên) đã lưu ở API createPaymentLink
        const orderCode = Number(booking.paymentDetails.transactionId);

        // 5. Truy vấn trạng thái giao dịch trực tiếp từ PayOS
        let paymentInfo;

        // Fallback linh hoạt để trị dứt điểm mọi phiên bản SDK của PayOS
        if (payos.paymentRequests && typeof payos.paymentRequests.get === 'function') {
            paymentInfo = await payos.paymentRequests.get(orderCode); // SDK v2 mới nhất
        } else {
            paymentInfo = await payos.getPaymentLinkInformation(orderCode); // SDK v1 cũ
        }

        // 6. Xử lý kết quả trả về và cập nhật cơ sở dữ liệu
        if (paymentInfo.status === 'PAID') {
            booking.status = 'PAID';
            booking.paymentDetails.paidAt = new Date();
            await booking.save();

            const serviceDoc = await Service.findById(booking.serviceId).select('name').lean();

            // 🔔 Thông báo cho USER (Khách hàng)
            await sendNotification({
                recipientId: booking.userId,
                recipientRole: 'USER',
                title: 'Đặt chỗ thành công! 🎉',
                content: `Đơn đặt chỗ #${booking.bookingCode} đã thanh toán thành công. Dịch vụ sẵn sàng phục vụ!`,
                category: 'BOOKING_STATUS',
                onClickUrl: '/account?tab=bookings', // Link tổng theo yêu cầu của bạn
                metadata: { bookingId: booking._id }
            });

            // 🔔 Thông báo cho OWNER (Chủ dịch vụ)
            await sendNotification({
                recipientId: booking.ownerId,
                recipientRole: 'OWNER',
                title: '🔔 Hệ thống ghi nhận đơn đặt mới',
                content: `Đơn hàng #${booking.bookingCode} của dịch vụ "${serviceDoc?.name || ''}" đã thanh toán thành công.`,
                category: 'BOOKING_STATUS',
                onClickUrl: '/owner/bookings', // Link tổng quản lý
                metadata: { bookingId: booking._id }
            });

            return ApiResponse.send(res, 200, 'Xác thực thanh toán thành công!', { status: 'PAID' });
        } else {
            return ApiResponse.send(res, 400, 'Đơn hàng chưa hoàn tất thanh toán.', { status: paymentInfo.status });
        }

    } catch (error) {
        if (error.response?.data) {
            console.error('Lỗi xác thực từ PayOS:', error.response.data);
            return next(new ApiError(400, 'Lỗi kiểm tra trạng thái: ' + error.response.data.desc));
        }
        next(error);
    }
};

// 👉 API: POST /api/payments/cancel/:bookingId
export const cancelPayment = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // 1. Tìm đơn hàng
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new ApiError(404, 'Không tìm thấy đơn hàng.');

        // Nếu đơn hàng không ở trạng thái PENDING (đã PAID hoặc EXPIRED) thì bỏ qua
        if (booking.status !== 'PENDING') {
            return ApiResponse.send(res, 200, 'Đơn hàng đã được xử lý trước đó.', booking);
        }

        // 2. Chuyển trạng thái đơn sang CANCELLED
        booking.status = 'CANCELLED';
        await booking.save();

        // 3. Tiến hành giải phóng kho lập tức
        let datesToRelease = [];
        const { checkInDate, checkOutDate, quantity } = booking.bookingDetails;

        if (checkInDate.getTime() !== checkOutDate.getTime()) {
            datesToRelease = getDatesInRange(checkInDate, checkOutDate);
        } else {
            datesToRelease = [new Date(checkInDate)];
        }

        for (const date of datesToRelease) {
            await ServiceInventory.findOneAndUpdate(
                { serviceId: booking.serviceId, date: date },
                {
                    $inc: {
                        availableSlots: quantity,
                        bookedSlots: -quantity
                    }
                }
            );
        }

        return ApiResponse.send(res, 200, 'Đã chủ động hủy đơn hàng và hoàn trả số lượng vào kho thành công.');

    } catch (error) {
        next(error);
    }
};