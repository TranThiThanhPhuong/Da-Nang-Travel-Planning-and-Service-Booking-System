import User from '../models/User.js';
import Service from '../models/Service.js';
import { sendNotification } from '../utils/notificationHelper.js';

/**
 * Hàm dùng chung để hạ cấp Owner về gói STARTER và thu hồi dịch vụ dôi dư
 * @param {string} ownerId - ID của người dùng (Owner)
 * @param {object} session - Session của MongoDB (để đảm bảo tính Atomic)
 */
export const downgradeOwnerToStarter = async (ownerId, session = null) => {
    // 1. Hạ cấp trạng thái tài khoản
    const owner = await User.findById(ownerId).session(session);
    if (!owner) throw new Error("Owner not found");

    owner.currentPackage = 'STARTER';
    owner.subscriptionStatus = 'EXPIRED';
    // Đặt ngày hết hạn về quá khứ hoặc hiện tại để đánh dấu đã hết hạn
    owner.subscriptionEndDate = new Date();
    await owner.save({ session });

    // 2. Thu hồi dịch vụ dôi dư: Giữ lại dịch vụ cũ nhất, ẩn các dịch vụ còn lại
    // Tìm tất cả dịch vụ đang APPROVED của owner này
    const ownerServices = await Service.find({ ownerId: owner._id, approvalStatus: 'APPROVED' })
        .sort({ createdAt: 1 }) // Sắp xếp cũ -> mới
        .session(session);

    // Gói STARTER chỉ cho phép 1 dịch vụ. Nếu có > 1, ẩn các dịch vụ từ cái thứ 2 trở đi
    if (ownerServices.length > 1) {
        const servicesToHideIds = ownerServices.slice(1).map(svc => svc._id);

        await Service.updateMany(
            { _id: { $in: servicesToHideIds } },
            { $set: { approvalStatus: 'HIDDEN' } },
            { session }
        );
    }

    // 3. Gửi thông báo cho đối tác
    await sendNotification({
        recipientId: owner._id,
        recipientRole: 'OWNER',
        title: '⚠️ Gói dịch vụ đã bị thu hồi',
        content: 'Hệ thống đã tự động thu hồi gói dịch vụ và hạ cấp tài khoản của bạn về gói STARTER do giao dịch đã bị hoàn tiền hoặc hết hạn.',
        category: 'FINANCIAL',
        onClickUrl: '/owner/subscription'
    }, session);
};