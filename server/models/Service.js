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
        ratingStats: {
            averageRating: { type: Number, default: 0, min: 0, max: 5 },
            totalReviews: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// MIDDLEWARE TỰ ĐỘNG TÍNH TOÁN
serviceSchema.pre('save', function (next) {
    if (this.pricePerUnit != null && this.discount != null) {
        this.finalPrice = this.pricePerUnit * (1 - this.discount / 100);
    }

    if (this.name || this.address) {
        const combinedString = `${this.name || ''} ${this.address || ''}`;
        this.searchString = removeVietnameseTones(combinedString);
    }

    next(); // CHỈ GỌI 1 LẦN Ở CUỐI
});
serviceSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    const price = update.pricePerUnit ?? update.$set?.pricePerUnit;
    const discount = update.discount ?? update.$set?.discount;

    if (price != null || discount != null) {
        const p = price != null ? price : 0;
        const d = discount != null ? discount : 0;
        if (!update.$set) update.$set = {};
        update.$set.finalPrice = p * (1 - d / 100);
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