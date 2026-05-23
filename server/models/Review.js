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
            maxlength: [500, 'Bình luận không được vượt quá 500 ký tự'],
        },
        isAnonymous: { type: Boolean, default: false },
        images: [{
            type: String
        }]
    },
    {
        timestamps: true,
    }
);

// Compound Index: Tăng tốc độ khi hiển thị danh sách Review của 1 Service, sắp xếp theo thời gian mới nhất
reviewSchema.index({ serviceId: 1, createdAt: -1 });

reviewSchema.statics.calculateAverageRating = async function (serviceId) {
    const stats = await this.aggregate([
        { $match: { serviceId: serviceId } },
        {
            $group: {
                _id: '$serviceId',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0) {
        await mongoose.model('Service').findByIdAndUpdate(serviceId, {
            'ratingStats.averageRating': Math.round(stats[0].avgRating * 10) / 10, // Làm tròn 1 chữ số thập phân
            'ratingStats.totalReviews': stats[0].nRating,
        });
    } else {
        await mongoose.model('Service').findByIdAndUpdate(serviceId, {
            'ratingStats.averageRating': 0,
            'ratingStats.totalReviews': 0,
        });
    }
};

// Gọi hàm tính toán sau khi lưu một Review mới
reviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.serviceId);
});

// Gọi hàm tính toán sau khi một Review bị xóa (nếu hệ thống có chức năng xóa review)
reviewSchema.post(['findOneAndUpdate', 'findOneAndDelete'], async function (doc) {
    if (doc) {
        // Gọi trực tiếp model thông qua mongoose để thực thi hàm tĩnh calculateAverageRating
        await doc.constructor.calculateAverageRating(doc.serviceId);
    }
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;