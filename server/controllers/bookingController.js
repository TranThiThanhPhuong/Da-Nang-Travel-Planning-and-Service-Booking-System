import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Review from '../models/Review.js';
import ServiceInventory from '../models/ServiceInventory.js';
import OwnerApplication from '../models/OwnerApplication.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { redlock } from '../config/redis.js';
import mongoose from 'mongoose';
import { sendNotification } from '../utils/notificationHelper.js';

const generateBookingCode = () => {
    return `DP-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
};

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

export const createBooking = async (req, res, next) => {
    const { serviceId, checkInDate, checkOutDate, quantity, customerInfo, note } = req.body;
    const userId = req.user._id;

    if (!customerInfo || !customerInfo.fullName || !customerInfo.phoneNumber || !customerInfo.email) {
        return res.status(400).json({
            success: false,
            message: 'Yêu cầu điền đầy đủ Họ tên, Số điện thoại và Email của người đại diện nhận phòng.'
        });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;

    if (!emailRegex.test(customerInfo.email)) return res.status(400).json({ success: false, message: 'Định dạng địa chỉ Email không đúng.' });
    if (!phoneRegex.test(customerInfo.phoneNumber)) return res.status(400).json({ success: false, message: 'Số điện thoại liên hệ không hợp lệ.' });

    const lockKey = `lock:service:${serviceId}`;
    let lock;

    try {
        lock = await redlock.acquire([lockKey], 5000);

        const service = await Service.findById(serviceId).select('ownerId pricePerUnit discount finalPrice type name');
        if (!service) throw new ApiError(404, 'Không tìm thấy dịch vụ.');

        // CHẶN OWNER TỰ ĐẶT DỊCH VỤ CỦA CHÍNH MÌNH
        if (service.ownerId.toString() === userId.toString()) {
            throw new ApiError(403, 'Bạn không thể đặt dịch vụ do chính mình cung cấp.');
        }

        const originalPrice = service.pricePerUnit || service.finalPrice;
        const discount = service.discount || 0;
        const unitPrice = service.finalPrice;

        let datesToBook = [];
        let totalPrice = 0;

        if (service.type === 'HOTEL') {
            if (!checkOutDate) throw new ApiError(400, 'Khách sạn yêu cầu ngày trả phòng.');
            datesToBook = getDatesInRange(checkInDate, checkOutDate);
            if (datesToBook.length === 0) throw new ApiError(400, 'Ngày trả phòng phải sau ngày nhận phòng.');

            totalPrice = unitPrice * quantity * datesToBook.length;
        } else {
            datesToBook = [new Date(checkInDate)];
            totalPrice = unitPrice * quantity;
        }

        const inventories = await ServiceInventory.find({
            serviceId,
            date: { $in: datesToBook }
        });

        if (inventories.length !== datesToBook.length) throw new ApiError(400, 'Dịch vụ chưa mở bán hoặc đã đóng trong khoảng thời gian này.');

        const updatedInventories = [];

        for (const inv of inventories) {
            if (inv.availableSlots < quantity) throw new ApiError(400, `Hết chỗ/phòng trong ngày ${inv.date.toLocaleDateString('vi-VN')}.`);

            const updatedInv = await ServiceInventory.findOneAndUpdate(
                { _id: inv._id, version: inv.version, availableSlots: { $gte: quantity } },
                { $inc: { availableSlots: -quantity, bookedSlots: quantity, version: 1 } },
                { new: true }
            );

            if (!updatedInv) {
                for (const rollbackInv of updatedInventories) {
                    await ServiceInventory.findByIdAndUpdate(rollbackInv._id, {
                        $inc: { availableSlots: quantity, bookedSlots: -quantity }
                    });
                }
                throw new ApiError(409, 'Dữ liệu đã bị thay đổi, vui lòng thử lại.');
            }
            updatedInventories.push(updatedInv);
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const finalCheckOutDate = service.type === 'HOTEL' ? checkOutDate : checkInDate;

        const newBooking = await Booking.create({
            bookingCode: generateBookingCode(),
            userId,
            serviceId,
            ownerId: service.ownerId,
            bookingDetails: {
                checkInDate,
                checkOutDate: finalCheckOutDate,
                quantity,
                originalPrice,
                discount,
                unitPrice,
                totalPrice,
                customerInfo: {
                    fullName: customerInfo.fullName.trim(),
                    phoneNumber: customerInfo.phoneNumber.trim(),
                    email: customerInfo.email.trim(),
                    note: note ? note.trim() : (customerInfo.note ? customerInfo.note.trim() : undefined)
                }
            },
            status: 'PENDING',
            expiresAt,
        });

        return ApiResponse.send(res, 201, 'Tạo đơn thành công, vui lòng thanh toán.', newBooking);

    } catch (error) {
        next(error);
    } finally {
        if (lock) await lock.release().catch((e) => console.error('Lỗi khi mở khóa Redlock:', e));
    }
};

// GET /api/bookings/my-bookings
export const getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const filter = { userId };

        if (req.query.status) {
            const statusArray = req.query.status.split(',');
            filter.status = { $in: statusArray };
        }

        // 1. Lấy danh sách Bookings và các thông tin dịch vụ như cũ
        const bookings = await Booking.find(filter)
            .populate('serviceId', 'name type thumbnail address pricePerUnit finalPrice ratingStats description')
            .sort({ createdAt: -1 })
            .lean();

        // 2. Gom tất cả `ownerId` có trong danh sách đơn hàng này để truy vấn một lần duy nhất (Tối ưu hiệu năng)
        const ownerIds = [...new Set(bookings.map(b => b.ownerId.toString()))];

        // Tìm tất cả đơn đăng ký doanh nghiệp ĐÃ ĐƯỢC DUYỆT (APPROVED) của các Owner này
        const ownerApps = await OwnerApplication.find({
            userId: { $in: ownerIds },
            status: 'APPROVED'
        }).lean();

        // Chuyển mảng ownerApps thành Map map để lookup cực nhanh theo ownerId
        const ownerAppMap = new Map(ownerApps.map(app => [app.userId.toString(), app]));

        // 3. Lấy tập hợp các đơn đã được review như cũ
        const reviewedBookingIds = await Review.find({ userId })
            .distinct('bookingId')
            .lean();
        const reviewedSet = new Set(reviewedBookingIds.map(id => id.toString()));

        // 4. Map dữ liệu để đính kèm thông tin đối tác chính xác vào từng Booking
        const finalBookings = bookings.map(booking => {
            const ownerInfo = ownerAppMap.get(booking.ownerId.toString());
            return {
                ...booking,
                isReviewed: reviewedSet.has(booking._id.toString()),
                // Bắn thêm object này về cho Frontend dùng trực tiếp
                ownerApplication: ownerInfo ? {
                    businessName: ownerInfo.businessName,
                    businessAddress: ownerInfo.businessAddress,
                    phoneNumber: ownerInfo.phoneNumber
                } : null
            };
        });

        return ApiResponse.send(res, 200, 'Lấy lịch sử đặt chỗ thành công.', finalBookings);
    } catch (error) {
        next(error);
    }
};

// @desc    Lấy danh sách đơn hàng cho Owner/Admin (Có bộ lọc, tìm kiếm)
// @route   GET /api/bookings/service-bookings
// @access  Private (Chỉ Owner hoặc Admin)
export const getAllBookings = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        let query = {};

        // Lọc theo trạng thái đơn hàng
        if (status && status !== 'ALL') {
            query.status = status;
        }

        // Nếu là OWNER, ép điều kiện chỉ lấy các đơn hàng thuộc quyền sở hữu của Owner đó
        if (req.user && req.user.role === 'OWNER') {
            query.ownerId = req.user._id;
        }

        let populateOptions = {
            path: 'userId',
            select: 'fullName email',
        };

        if (search) {
            const cleanSearch = search.trim();
            if (mongoose.Types.ObjectId.isValid(cleanSearch)) {
                query._id = cleanSearch;
            } else {
                populateOptions.match = {
                    fullName: { $regex: cleanSearch, $options: 'i' }
                };
            }
        }

        let bookings = await Booking.find(query)
            .populate(populateOptions)
            .populate({
                path: 'serviceId',
                select: 'name pricePerUnit discount finalPrice type'
            })
            .sort({ createdAt: -1 })
            .lean();

        // Loại bỏ các bản ghi không khớp kết quả map tên khách hàng của populate.match
        if (search && !mongoose.Types.ObjectId.isValid(search)) {
            bookings = bookings.filter(b => b.userId !== null);
        }

        // 4. Tính toán số lượng thống kê real-time phục vụ cho các thẻ Bento dựa trên quyền hạn
        const countQuery = req.user && req.user.role === 'OWNER' ? { ownerId: req.user._id } : {};
        const allSystemBookings = await Booking.find(countQuery).lean();

        const statsCounter = {
            TOTAL: allSystemBookings.length,
            PAID: allSystemBookings.filter(b => b.status === 'PAID').length,
            CANCELLATION_PENDING: allSystemBookings.filter(b => b.status === 'CANCELLATION_PENDING').length,
            COMPLETED: allSystemBookings.filter(b => b.status === 'COMPLETED').length,
            CANCELLED: allSystemBookings.filter(b => b.status === 'CANCELLED').length,
        }

        return ApiResponse.send(res, 200, 'Lấy danh sách đơn đặt chỗ thành công.', {
            stats: statsCounter,
            bookings: bookings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Khách hàng gửi yêu cầu hủy đơn đặt chỗ
 * @route   POST /api/bookings/:id/cancel
 */
export const cancelBooking = async (req, res, next) => {
    const bookingId = req.params.id;
    const userId = req.user._id;
    const { reason, bankName, accountNumber, accountName } = req.body;

    try {
        const booking = await Booking.findOne({ _id: bookingId, userId });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt chỗ của bạn.' });
        }

        if (!['PENDING', 'PAID'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: `Đơn hàng ở trạng thái [${booking.status}] không thể hủy.` });
        }

        const now = new Date();
        const checkInDate = new Date(booking.bookingDetails.checkInDate);
        const hoursDiff = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // =========================================================================
        // TRƯỜNG HỢP 1: ĐƠN CHƯA THANH TOÁN (PENDING) -> GIẢI PHÓNG KHO & HỦY LUÔN
        // =========================================================================
        if (booking.status === 'PENDING') {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                let datesToRelease = [new Date(booking.bookingDetails.checkInDate)];
                if (booking.bookingDetails.checkOutDate) {
                    const days = getDatesInRange(booking.bookingDetails.checkInDate, booking.bookingDetails.checkOutDate);
                    if (days.length > 0) datesToRelease = days;
                }

                const quantityToRelease = booking.bookingDetails.quantity;

                for (const dateOfInv of datesToRelease) {
                    const inv = await ServiceInventory.findOne({
                        serviceId: booking.serviceId,
                        date: dateOfInv
                    }).session(session);

                    if (inv) {
                        inv.bookedSlots = Math.max(0, inv.bookedSlots - quantityToRelease);
                        inv.version += 1;
                        await inv.save({ session });
                    }
                }

                booking.status = 'EXPIRED';
                booking.version += 1;
                await booking.save({ session });

                await session.commitTransaction();
                session.endSession();

                return res.status(200).json({
                    success: true,
                    message: 'Hủy đơn hàng chưa thanh toán thành công. Chỗ đặt đã được giải phóng.',
                    data: booking
                });
            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                throw err;
            }
        }

        // =========================================================================
        // TRƯỜNG HỢP 2: ĐƠN ĐÃ THANH TOÁN (PAID) -> CHỈ LẬP ĐƠN CHỜ (KHÔNG NHẢ KHO TẠI ĐÂY)
        // =========================================================================
        if (booking.status === 'PAID') {
            if (!bankName || !accountNumber || !accountName) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng để nhận hoàn tiền.'
                });
            }

            let refundRate = 0;
            if (hoursDiff > 72) refundRate = 1.0;
            else if (hoursDiff >= 24 && hoursDiff <= 72) refundRate = 0.5;
            else refundRate = 0.0;

            const totalPrice = booking.bookingDetails.totalPrice;
            const refundAmount = totalPrice * refundRate;
            const penaltyAmount = totalPrice - refundAmount;

            booking.status = 'CANCELLATION_PENDING';
            booking.cancellationDetails = {
                reason: reason || 'Khách hàng yêu cầu hủy đơn',
                bankInfo: { bankName, accountNumber, accountName },
                refundRate,
                refundAmount,
                penaltyAmount,
                requestedAt: now
            };

            booking.version += 1;
            await booking.save();

            await sendNotification({
                recipientId: booking.ownerId,
                recipientRole: 'OWNER',
                title: '⚠️ Yêu cầu hủy đơn & hoàn tiền mới',
                content: `Khách hàng yêu cầu hủy đơn #${booking.bookingCode}. Số tiền dự kiến cần hoàn trả: ${refundAmount.toLocaleString('vi-VN')} VND.`,
                category: 'FINANCIAL',
                onClickUrl: '/owner/bookings',
                metadata: { bookingId: booking._id }
            });

            return res.status(200).json({
                success: true,
                message: `Gửi yêu cầu thành công. Số tiền dự kiến hoàn: ${refundAmount.toLocaleString('vi-VN')} VND. Vui lòng đợi Chủ dịch vụ xác nhận chuyển khoản để hoàn tất hoàn chỗ.`,
                data: booking
            });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi hủy đơn: ' + error.message });
    }
};

/**
 * @desc    Owner xác nhận đã chuyển khoản trả tiền hoàn thành công -> CHÍNH THỨC TRẢ CHỖ KHỎI KHO
 * @route   PATCH /api/bookings/:id/confirm-refund
 */
export const confirmOwnerRefund = async (req, res, next) => {
    const bookingId = req.params.id;
    const ownerId = req.user._id; // Đảm bảo đúng owner của đơn
    const { refundAmount } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findOne({ _id: bookingId, ownerId }).session(session);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt chỗ cần xử lý hoàn tiền.' });
        }

        if (booking.status !== 'CANCELLATION_PENDING') {
            return res.status(400).json({ success: false, message: 'Đơn hàng này không ở trạng thái chờ duyệt hoàn tiền.' });
        }

        // --- TIẾN HÀNH TRẢ LẠI CHỖ VÀ VÉ VÀO KHO SAU KHI OWNER XÁC NHẬN ĐÃ TRẢ TIỀN ---
        let datesToRelease = [new Date(booking.bookingDetails.checkInDate)];
        if (booking.bookingDetails.checkOutDate) {
            const days = getDatesInRange(booking.bookingDetails.checkInDate, booking.bookingDetails.checkOutDate);
            if (days.length > 0) datesToRelease = days;
        }

        const quantityToRelease = booking.bookingDetails.quantity;

        for (const dateOfInv of datesToRelease) {
            const inv = await ServiceInventory.findOne({
                serviceId: booking.serviceId,
                date: dateOfInv
            }).session(session);

            if (inv) {
                inv.bookedSlots = Math.max(0, inv.bookedSlots - quantityToRelease);
                inv.version += 1;
                await inv.save({ session });
            }
        }

        // Đơn hàng chính thức chuyển trạng thái cuối cùng thành CANCELLED
        booking.status = 'CANCELLED';
        booking.cancellationDetails = {
            ...booking.cancellationDetails.toObject(),
            refundAmount: Number(refundAmount) || booking.cancellationDetails.refundAmount,
            refundedAt: new Date()
        };

        booking.version += 1;
        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        await sendNotification({
            recipientId: booking.userId,
            recipientRole: 'USER',
            title: '💸 Đơn hàng đã được hoàn tiền thành công',
            content: `Yêu cầu hủy đơn #${booking.bookingCode} đã hoàn tất. Số tiền hoàn trả đã được chuyển về tài khoản của bạn.`,
            category: 'FINANCIAL',
            onClickUrl: '/account?tab=bookings',
            metadata: { bookingId: booking._id }
        });

        return res.status(200).json({
            success: true,
            message: 'Xác nhận hoàn tiền thành công. Chỗ trống đã được hoàn lại kho hệ thống và đơn đổi sang CANCELLED.',
            data: booking
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xác nhận hoàn tiền: ' + error.message });
    }
};