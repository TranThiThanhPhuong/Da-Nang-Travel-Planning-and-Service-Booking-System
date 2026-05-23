import mongoose from 'mongoose';

const subscriptionPackageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên gói dịch vụ là bắt buộc'],
            trim: true,
        },
        packageCode: {
            type: String,
            enum: ['STARTER', 'PRO', 'ULTIMATE'],
            required: [true, 'Mã gói dịch vụ là bắt buộc'],
            unique: true,
            index: true,
        },
        price: {
            type: Number,
            required: [true, 'Giá gói là bắt buộc'],
            min: [0, 'Giá không được là số âm'],
        },
        durationDays: {
            type: Number,
            required: [true, 'Thời hạn sử dụng là bắt buộc'],
            min: [1, 'Thời hạn tối thiểu là 1 ngày'],
        },
        // --- BỘ CẤU HÌNH GIỚI HẠN SAAS (QUOTAS) ---
        maxServices: {
            type: Number,
            required: [true, 'Giới hạn số lượng dịch vụ là bắt buộc'],
            default: 1,
            // Dùng -1 để biểu thị "Không giới hạn"
        },
        hasPremiumBadge: {
            type: Boolean,
            default: false,
        },
        // ------------------------------------------
        features: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true, // Index để Admin truy vấn danh sách các gói đang mở bán nhanh hơn
        },
    },
    {
        timestamps: true,
    }
);

const SubscriptionPackage = mongoose.models.SubscriptionPackage || mongoose.model('SubscriptionPackage', subscriptionPackageSchema);

export default SubscriptionPackage;