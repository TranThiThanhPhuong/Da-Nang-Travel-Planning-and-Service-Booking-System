// controllers/notificationController.js
import Notification from '../models/Notification.js';
import ApiResponse from '../utils/ApiResponse.js'; // Giả định class trả về response của bạn

// Lấy danh sách thông báo (phân trang)
export const getMyNotifications = async (req, res, next) => {
    try {
        const recipientId = req.user._id; 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipientId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUnread = await Notification.countDocuments({ recipientId, isRead: false });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách thông báo thành công.",
            data: {
                notifications,
                totalUnread,
                currentPage: page
            }
        });
    } catch (error) {
        next(error);
    }
};

// Đánh dấu tất cả hoặc một thông báo là đã đọc
export const markAsRead = async (req, res, next) => {
    try {
        const recipientId = req.user._id;
        const { notificationId } = req.body; // Nếu truyền lên ID thì đọc 1 cái, không truyền thì đọc hết

        if (notificationId) {
            await Notification.updateOne(
                { _id: notificationId, recipientId },
                { $set: { isRead: true, readAt: new Date() } }
            );
        } else {
            await Notification.updateMany(
                { recipientId, isRead: false },
                { $set: { isRead: true, readAt: new Date() } }
            );
        }

        return res.status(200).json({ success: true, message: "Đã đánh dấu đọc." });
    } catch (error) {
        next(error);
    }
};