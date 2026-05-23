import cron from 'node-cron';
import Booking from '../models/Booking.js';
import ServiceInventory from '../models/ServiceInventory.js';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import payOS from '../config/payos.js';

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
        try {
            const now = new Date();

            // 1. Tìm các đơn PENDING đã quá hạn expiresAt
            const expiredBookings = await Booking.find({
                status: 'PENDING',
                expiresAt: { $lt: now }
            });

            if (expiredBookings.length === 0) return;

            console.log(`⚠️ Cronjob: Phát hiện ${expiredBookings.length} đơn Booking hết hạn. Đang tiến hành dọn dẹp và hoàn kho...`);

            // Mảng chứa dữ liệu để xử lý hàng loạt
            const expiredBookingIds = [];
            const inventoryBulkOps = [];
            const payosCancelPromises = [];

            // 2. CHUẨN BỊ DỮ LIỆU ĐỂ BẮN HÀNG LOẠT (KHÔNG GỌI DB TRONG VÒNG LẶP NÀY)
            for (const booking of expiredBookings) {
                expiredBookingIds.push(booking._id);

                // Chuẩn bị Hủy link PayOS (Nếu khách dùng chuyển khoản)
                if (booking.payosOrderCode) {
                    payosCancelPromises.push(
                        payOS.paymentRequests.cancel(Number(booking.payosOrderCode), "Quá thời gian thanh toán")
                            .catch(() => { }) // Bỏ qua lỗi nếu link đã tự hủy bên PayOS
                    );
                }

                // Tính toán các ngày cần hoàn kho
                let datesToRelease = [];
                const { checkInDate, checkOutDate, quantity } = booking.bookingDetails;

                // Đảm bảo checkInDate và checkOutDate là Object Date hợp lệ
                const startDate = new Date(checkInDate);
                const endDate = new Date(checkOutDate);

                if (startDate.getTime() !== endDate.getTime()) {
                    datesToRelease = getDatesInRange(startDate, endDate);
                } else {
                    datesToRelease = [startDate];
                }

                // TỐI ƯU 2: Đưa lệnh update kho vào mảng BulkWrite
                for (const date of datesToRelease) {
                    inventoryBulkOps.push({
                        updateOne: {
                            filter: { serviceId: booking.serviceId, date: date },
                            update: {
                                $inc: {
                                    availableSlots: quantity,
                                    bookedSlots: -quantity
                                }
                            }
                        }
                    });
                }
            }

            // 3. THỰC THI DATABASE BẰNG LỆNH GỘP (BULK OPERATIONS)

            // 3.1 Cập nhật toàn bộ Booking sang EXPIRED
            await Booking.updateMany(
                { _id: { $in: expiredBookingIds } },
                { $set: { status: 'EXPIRED' } }
            );

            // 3.2 Cập nhật toàn bộ Inventory
            if (inventoryBulkOps.length > 0) {
                await ServiceInventory.bulkWrite(inventoryBulkOps);
            }

            // 3.3 Hủy toàn bộ link PayOS chạy song song cùng lúc
            if (payosCancelPromises.length > 0) {
                await Promise.allSettled(payosCancelPromises);
            }

            console.log(`✅ Đã giải phóng kho và dọn dẹp thành công ${expiredBookings.length} đơn Booking.`);

        } catch (error) {
            console.error('❌ Lỗi thực thi Cronjob Booking:', error.message);
        }
    });

    // Chạy mỗi 1 phút - Quét và hủy các hóa đơn PENDING đã quá 15 phút
    cron.schedule('* * * * *', async () => {
        try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            // Lấy ra các đơn PENDING tạo cách đây hơn 15 phút
            const expiredTransactions = await SubscriptionTransaction.find({
                status: 'PENDING',
                createdAt: { $lte: fifteenMinutesAgo }
            });

            if (expiredTransactions.length > 0) {
                console.log(`⏳ Cronjob: Đang dọn dẹp ${expiredTransactions.length} hóa đơn mua gói SaaS quá hạn 15 phút...`);

                for (const tx of expiredTransactions) {
                    tx.status = 'CANCELLED';
                    await tx.save();

                    // Đồng bộ lệnh hủy sang cổng PayOS
                    try {
                        if (tx.payosOrderCode) {
                            // TỐI ƯU 2: Đảm bảo truyền kiểu Number và đính kèm lý do hủy
                            await payOS.paymentRequests.cancel(
                                Number(tx.payosOrderCode),
                                "Hết thời gian thanh toán"
                            );
                        }
                    } catch (payosErr) {
                        // Link có thể đã tự hết hạn trên hệ thống PayOS, bỏ qua cảnh báo
                    }
                }
                console.log('✅ Cronjob: Đã dọn dẹp xong hóa đơn quá hạn.');
            }
        } catch (error) {
            console.error('❌ Lỗi tiến trình Cronjob hủy hóa đơn:', error);
        }
    });

    // Chạy vào lúc 00:00 mỗi đêm - Quét hạ cấp các gói SaaS hết hạn
    cron.schedule('0 0 * * *', async () => {
        console.log('⏳ Cronjob: Đang quét kiểm tra thời hạn gói của các Cơ sở đối tác...');
        try {
            const now = new Date();

            // 1. Tìm các chủ cơ sở đang Active nhưng đã quá ngày gia hạn
            const expiredOwners = await User.find({
                role: 'OWNER',
                subscriptionStatus: 'ACTIVE',
                subscriptionEndDate: { $lt: now }
            });

            if (expiredOwners.length === 0) {
                console.log('✅ Cronjob: Không có gói SaaS nào hết hạn hôm nay.');
                return;
            }

            for (const owner of expiredOwners) {
                // 2. Hạ cấp User về STARTER
                owner.currentPackage = 'STARTER';
                owner.subscriptionStatus = 'EXPIRED';
                await owner.save();

                // 3. XỬ LÝ DỊCH VỤ DÔI DƯ: Tìm tất cả dịch vụ APPROVED xếp từ cũ đến mới
                const ownerServices = await Service.find({
                    ownerId: owner._id,
                    approvalStatus: 'APPROVED'
                }).sort({ createdAt: 1 });

                // Gói STARTER chỉ cho phép chạy tối đa 1 dịch vụ. Ẩn tất cả từ dịch vụ thứ 2 trở đi
                if (ownerServices.length > 1) {
                    // Lấy mảng ID của các dịch vụ cần ẩn
                    const servicesToHideIds = ownerServices.slice(1).map(svc => svc._id);

                    // Tối ưu: Dùng 1 lệnh updateMany duy nhất thay vì vòng lặp
                    await Service.updateMany(
                        { _id: { $in: servicesToHideIds } },
                        { $set: { approvalStatus: 'HIDDEN' } }
                    );
                }
            }

            console.log(`✅ Cronjob: Đã xử lý hạ cấp thành công cho ${expiredOwners.length} đối tác.`);
        } catch (error) {
            console.error('❌ Lỗi tiến trình Cronjob quét hết hạn gói SaaS:', error);
        }
    });
};

export default initCronJobs;