import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Gửi thông báo hệ thống và kích hoạt real-time
 * @param {Object} params
 * @param {String} params.recipientId - ID người nhận
 * @param {String} params.recipientRole - USER | OWNER | ADMIN
 * @param {String} params.title - Tiêu đề thông báo
 * @param {String} params.content - Nội dung chi tiết
 * @param {String} params.category - BOOKING_STATUS | FINANCIAL | ACCOUNT_SAAS | SYSTEM_ALERT
 * @param {String} [params.onClickUrl] - Đường dẫn điều hướng ở Frontend
 * @param {Object} [params.metadata] - Dữ liệu kèm theo (bookingId, serviceId...)
 */
export const sendNotification = async ({
    recipientId, // Thay đổi: Có thể là String hoặc Array [id1, id2...]
    recipientRole,
    title,
    content,
    category,
    onClickUrl = '',
    metadata = {}
}) => {
    try {
        // 1. CHUYỂN ĐỔI THÀNH MẢNG ĐỂ XỬ LÝ ĐỒNG NHẤT
        const recipientIds = Array.isArray(recipientId) ? recipientId : [recipientId];

        // Loại bỏ các ID lỗi hoặc null/undefined để đảm bảo an toàn DB
        const validIds = recipientIds.filter(id => id); 

        if (validIds.length === 0) {
            console.error("⚠️ Không thể gửi thông báo: Thiếu recipientId hợp lệ.");
            return;
        }

        // 2. LƯU ĐỒNG THỜI VÀO DATABASE CHO TẤT CẢ ADMIN / USER
        const savePromises = validIds.map(async (id) => {
            return await Notification.create({
                recipientId: id, // Đảm bảo luôn có ID hợp lệ, không bao giờ null
                recipientRole,
                title,
                content,
                category,
                onClickUrl,
                metadata
            });
        });

        // Đợi tất cả bản ghi được lưu xong vào DB
        const createdNotifications = await Promise.all(savePromises);

        // 3. KÍCH HOẠT PHÁT REAL-TIME QUA SOCKET
        if (global.io) {
            if (recipientRole === 'ADMIN') {
                // Đối với Admin, ta bắn 1 phát duy nhất vào ADMIN_ROOM cho nhanh và tối ưu
                // Lấy bản ghi đầu tiên làm đại diện dữ liệu gửi qua Socket
                global.io.to('ADMIN_ROOM').emit('NEW_NOTIFICATION', createdNotifications[0]);
                console.log(`⚡ [Socket] Đã bắn thông báo Admin tới ADMIN_ROOM`);
            } else {
                // Đối với User hoặc Owner (đơn lẻ), bắn vào phòng cá nhân như cũ
                for (const id of validIds) {
                    const targetUser = await User.findById(id).select('clerkId').lean();
                    const socketTargetId = targetUser?.clerkId || id; 
                    const roomName = `${recipientRole}_${socketTargetId}`;
                    
                    global.io.to(roomName).emit('NEW_NOTIFICATION', createdNotifications[0]);
                    console.log(`⚡ [Socket] Đã bắn thông báo tới phòng cá nhân: ${roomName}`);
                }
            }
        }

        return createdNotifications;
    } catch (error) {
        console.error('❌ Lỗi không thể gửi thông báo:', error);
    }
};