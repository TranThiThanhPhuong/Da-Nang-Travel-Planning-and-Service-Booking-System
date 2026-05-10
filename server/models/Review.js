import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
            required: true,
            index: true,
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            unique: true, // 1 booking chỉ được đánh giá 1 lần
        },
        rating: {
            type: Number,
            required: [true, 'Điểm đánh giá là bắt buộc'],
            min: [1, 'Đánh giá tối thiểu là 1 sao'],
            max: [5, 'Đánh giá tối đa là 5 sao'],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, 'Bình luận không được vượt quá 1000 ký tự'],
        },
    },
    {
        timestamps: true,
    }
);

// Compound Index: Tăng tốc độ khi hiển thị danh sách Review của 1 Service, sắp xếp theo thời gian mới nhất
reviewSchema.index({ serviceId: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;