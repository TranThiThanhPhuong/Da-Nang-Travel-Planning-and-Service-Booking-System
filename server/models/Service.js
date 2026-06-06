import mongoose from 'mongoose';
import { removeVietnameseTones } from '../utils/stringUtils.js';

const serviceSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Tên dịch vụ là bắt buộc'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['HOTEL', 'RESTAURANT', 'ACTIVITY'],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        pricePerUnit: {
            type: Number,
            required: true,
            min: 0,
        },
        discount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            max: 100,
        },
        finalPrice: {
            type: Number,
            min: 0,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [Longitude, Latitude]
                required: true,
            },
        },
        address: {
            type: String,
            required: true,
        },
        searchString: {
            type: String,
            index: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        images: [{ type: String }],
        features: [{ type: String }],
        approvalStatus: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'],
            default: 'PENDING',
        },
        adminNotes: {
            type: String,
        },
        ratingStats: {
            averageRating: { type: Number, default: 0, min: 0, max: 5 },
            totalReviews: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// MIDDLEWARE TỰ ĐỘNG TÍNH TOÁN KHI SAVE (TẠO MỚI)
serviceSchema.pre('save', function (next) {
    if (this.pricePerUnit != null) {
        const discountValue = this.discount || 0;
        this.finalPrice = this.pricePerUnit * (1 - discountValue / 100);
    }

    if (this.name || this.address) {
        const combinedString = `${this.name || ''} ${this.address || ''}`;
        this.searchString = removeVietnameseTones(combinedString);
    }

    next();
});

// MIDDLEWARE TỰ ĐỘNG TÍNH TOÁN KHI UPDATE
serviceSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    const currentSet = update.$set || update;

    // 1. Tính toán lại finalPrice nếu có thay đổi pricePerUnit hoặc discount
    if (currentSet.pricePerUnit !== undefined || currentSet.discount !== undefined) {
        // Lưu ý: Nếu update thiếu 1 trong 2 trường, ta cần lấy tạm từ document gốc hoặc mặc định
        // Để an toàn và triệt để nhất, logic controller nên gửi kèm cả 2 hoặc ta xử lý fallback:
        const price = currentSet.pricePerUnit !== undefined ? currentSet.pricePerUnit : 0;
        const discount = currentSet.discount !== undefined ? currentSet.discount : 0;

        currentSet.finalPrice = price * (1 - discount / 100);
    }

    // 2. Tính toán lại searchString nếu sửa tên hoặc địa chỉ
    if (currentSet.name || currentSet.address) {
        const nameStr = currentSet.name || '';
        const addressStr = currentSet.address || '';
        const combinedString = `${nameStr} ${addressStr}`;
        if (combinedString.trim()) {
            currentSet.searchString = removeVietnameseTones(combinedString);
        }
    }

    next();
});

// ĐÁNH CHỈ MỤC (INDEXING) CHO TÌM KIẾM
serviceSchema.index({ type: 1, approvalStatus: 1 });
serviceSchema.index({ name: 'text', address: 'text' });
serviceSchema.index({ location: '2dsphere' });
serviceSchema.index({ finalPrice: 1 }); // Index cho việc sort và filter theo giá thực tế
serviceSchema.index({ 'ratingStats.averageRating': -1 });

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;