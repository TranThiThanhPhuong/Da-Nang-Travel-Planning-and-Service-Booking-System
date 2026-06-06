import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true, // Đánh index để tối ưu tốc độ câu lệnh lấy thông báo của tôi (getMyNotifications)
        },
        recipientRole: {
            type: String,
            enum: ['USER', 'OWNER', 'ADMIN'],
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                'BOOKING_STATUS',    // Trạng thái đơn hàng (Đặt thành công, Hủy, Xác nhận...)
                'FINANCIAL',          // Tài chính (Thanh toán, Hoàn tiền, Đối soát, Rút tiền...)
                'ACCOUNT_SAAS',       // Tài khoản & SaaS (Duyệt đối tác, hết hạn gói, cảnh báo slot...)
                'SYSTEM_ALERT'        // Cảnh báo hệ thống (Dành riêng cho Admin, lỗi Webhook...)
            ],
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true, // Phục vụ tối ưu câu lệnh đếm số thông báo chưa đọc (Count unread)
        },
        readAt: {
            type: Date,
        },
        // Khi người dùng click vào thông báo, hệ thống biết chính xác cần chuyển hướng sang Link nào
        onClickUrl: {
            type: String, 
            description: "Đường dẫn chuyển hướng trên Frontend (Ví dụ: /owner/bookings/KS-992 hoặc /profile/orders)"
        },
        // Lưu trữ ID tham chiếu của các đối tượng liên quan (bookingId, serviceId, v.v.) để truy vấn sâu nếu cần
        metadata: {
            bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
            serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
            transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionTransaction' },
            customData: { type: Map, of: String } // Các dữ liệu động phát sinh ngoài dự kiến
        }
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;