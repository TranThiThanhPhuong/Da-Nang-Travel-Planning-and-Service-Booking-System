import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingDetails: {
      checkInDate: {
        type: Date,
        required: true,
        index: true,
      },
      checkOutDate: {
        type: Date,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      unitPrice: {
        type: Number,
        required: true,
        min: 0, // Giá của 1 đơn vị/đêm tại thời điểm đặt (chống việc chủ đổi giá sau này)
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      customerInfo: {
        fullName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
        note: { type: String, maxlength: 1000 },
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 } // TTL Index: Tự động xóa/quét khi hết hạn giữ chỗ (VD: 15 phút)
    },
    paymentDetails: {
      transactionId: { type: String }, // Mã giao dịch trả về từ PayOS
      paidAt: { type: Date },
    },
    version: {
      type: Number,
      default: 1, // Dùng để xử lý Optimistic Locking
    },
  },
  {
    timestamps: true,
  }
);

// Index để tối ưu truy vấn
bookingSchema.index({ serviceId: 1, 'bookingDetails.checkInDate': 1 });
bookingSchema.index({ ownerId: 1, status: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;