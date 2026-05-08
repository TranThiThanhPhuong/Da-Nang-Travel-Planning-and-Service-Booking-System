import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
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
      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      note: {
        type: String,
        maxlength: 1000,
      },
    },
    status: {
      bookingStatus: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'],
        default: 'PENDING',
      },
      paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PAID', 'REFUNDED'],
        default: 'UNPAID',
      },
    },
    ownerVnpayTxnRef: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tối ưu truy vấn theo serviceId và ngày check-in, cũng như theo trạng thái booking
bookingSchema.index({ serviceId: 1, 'bookingDetails.checkInDate': 1 });
bookingSchema.index({ serviceId: 1, 'status.bookingStatus': 1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;