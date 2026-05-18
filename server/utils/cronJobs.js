import cron from 'node-cron';
import Booking from '../models/Booking.js';
import ServiceInventory from '../models/ServiceInventory.js';

// Hàm helper lấy danh sách các ngày
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

const initCronJobs = () => {
    // Chạy mỗi phút một lần (mã: * * * * *)
    cron.schedule('* * * * *', async () => {
        console.log('⏳ Cronjob: Đang kiểm tra các đơn hàng hết hạn thanh toán...');

        try {
            const now = new Date();

            // 1. Tìm các đơn PENDING đã quá hạn expiresAt
            const expiredBookings = await Booking.find({
                status: 'PENDING',
                expiresAt: { $lt: now }
            });

            if (expiredBookings.length === 0) return;

            console.log(`⚠️ Phát hiện ${expiredBookings.length} đơn hết hạn. Đang tiến hành hoàn kho...`);

            for (const booking of expiredBookings) {
                // 2. Chuyển trạng thái đơn sang EXPIRED
                booking.status = 'EXPIRED';
                await booking.save();

                // 3. Tính toán các ngày cần hoàn kho
                // Nếu là HOTEL thì tính theo khoảng, RESTAURANT/ACTIVITY thì tính đúng 1 ngày checkIn
                let datesToRelease = [];
                const { checkInDate, checkOutDate, quantity } = booking.bookingDetails;

                if (checkInDate.getTime() !== checkOutDate.getTime()) {
                    datesToRelease = getDatesInRange(checkInDate, checkOutDate);
                } else {
                    datesToRelease = [new Date(checkInDate)];
                }

                // 4. Cập nhật lại Inventory cho từng ngày
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

                console.log(`✅ Đã giải phóng kho cho đơn: ${booking.bookingCode}`);
            }
        } catch (error) {
            console.error('❌ Lỗi thực thi Cronjob:', error.message);
        }
    });
};

export default initCronJobs;