import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import ServiceInventory from '../models/ServiceInventory.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { redlock } from '../config/redis.js';

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

    const lockKey = `lock:service:${serviceId}`;
    let lock;

    try {
        lock = await redlock.acquire([lockKey], 5000);

        // 1. Kiểm tra thông tin phân loại và biểu phí gốc của dịch vụ
        const service = await Service.findById(serviceId).select('ownerId price discount finalPrice type name');
        if (!service) throw new ApiError(404, 'Không tìm thấy dịch vụ.');

        // Tính toán các mốc giá dựa trên cấu hình lưu trữ
        const originalPrice = service.price || service.finalPrice;
        const discount = service.discount || 0;
        const unitPrice = service.finalPrice;
        let datesToBook = [];
        let totalPrice = 0;

        // 2. Định biên khoảng ngày lưu trữ dựa theo loại hình dịch vụ
        if (service.type === 'HOTEL') {
            if (!checkOutDate) throw new ApiError(400, 'Khách sạn yêu cầu ngày trả phòng.');
            datesToBook = getDatesInRange(checkInDate, checkOutDate);
            if (datesToBook.length === 0) throw new ApiError(400, 'Ngày trả phòng phải sau ngày nhận phòng.');

            totalPrice = unitPrice * quantity * datesToBook.length;
        } else {
            datesToBook = [new Date(checkInDate)];
            totalPrice = unitPrice * quantity;
        }

        // 3. Thực thi nghiệp vụ kiểm tra trạng thái khả dụng kho
        const inventories = await ServiceInventory.find({
            serviceId,
            date: { $in: datesToBook }
        });

        if (inventories.length !== datesToBook.length) {
            throw new ApiError(400, 'Dịch vụ chưa mở bán hoặc đã đóng trong khoảng thời gian này.');
        }

        const updatedInventories = [];

        for (const inv of inventories) {
            if (inv.availableSlots < quantity) {
                throw new ApiError(400, `Hết chỗ/phòng trong ngày ${inv.date.toLocaleDateString('vi-VN')}.`);
            }

            const updatedInv = await ServiceInventory.findOneAndUpdate(
                {
                    _id: inv._id,
                    version: inv.version,
                    availableSlots: { $gte: quantity }
                },
                {
                    $inc: {
                        availableSlots: -quantity,
                        bookedSlots: quantity,
                        version: 1
                    }
                },
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

        // 4. Khởi tạo bản ghi đặt chỗ và đính kèm chi tiết biểu phí chiết khấu
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
                    ...customerInfo,
                    note
                }
            },
            status: 'PENDING',
            expiresAt,
        });

        return ApiResponse.send(res, 201, 'Tạo đơn thành công, vui lòng thanh toán.', newBooking);

    } catch (error) {
        next(error);
    } finally {
        if (lock) {
            await lock.release().catch((e) => console.error('Lỗi khi mở khóa Redlock:', e));
        }
    }
};

// GET /api/bookings/my-bookings
export const getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Truy vấn tất cả Booking của user này, xếp đơn mới nhất lên đầu
        const bookings = await Booking.find({ userId })
            .populate('serviceId', 'name thumbnail address type ratingStats')
            .sort({ createdAt: -1 })
            .lean(); // Dùng lean() để tối ưu tốc độ đọc

        return ApiResponse.send(res, 200, 'Lấy lịch sử đặt chỗ thành công.', bookings);
    } catch (error) {
        next(error);
    }
};