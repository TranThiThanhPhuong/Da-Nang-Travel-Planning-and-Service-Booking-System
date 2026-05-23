import mongoose from 'mongoose';

const subscriptionTransactionSchema = new mongoose.Schema(
    {
        transactionCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubscriptionPackage',
            required: true,
        },
        packageCode: {
            type: String,
            enum: ['STARTER', 'PRO', 'ULTIMATE'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        durationDays: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'CANCELLED'],
            default: 'PENDING',
            index: true,
        },
        payosOrderCode: {
            type: Number, // Mã đơn hàng số (để mapping với cổng thanh toán PayOS)
            unique: true,
            sparse: true,
        },
        paidAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

subscriptionTransactionSchema.index({ ownerId: 1, createdAt: -1 });

const SubscriptionTransaction = mongoose.models.SubscriptionTransaction || mongoose.model('SubscriptionTransaction', subscriptionTransactionSchema);

export default SubscriptionTransaction;