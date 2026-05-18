import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
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
        }
    },
    { timestamps: true }
);

// Ràng buộc 1 User chỉ được lưu 1 Service duy nhất 1 lần
wishlistSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

export default mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);