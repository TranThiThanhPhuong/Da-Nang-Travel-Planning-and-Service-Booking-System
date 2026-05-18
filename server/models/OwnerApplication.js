import mongoose from 'mongoose';

const ownerApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    businessName: {
      type: String,
      required: [true, 'Tên doanh nghiệp là bắt buộc'],
      trim: true,
    },
    businessAddress: {
      type: String,
      required: [true, 'Địa chỉ kinh doanh là bắt buộc'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      match: [/^(0|84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại Việt Nam không hợp lệ'],
    },
    bankAccount: {
      bankName: { type: String, required: [true, 'Tên ngân hàng là bắt buộc'] },
      accountNumber: {
        type: String,
        required: [true, 'Số tài khoản là bắt buộc'],
        match: [/^[0-9]{6,15}$/, 'Số tài khoản không hợp lệ']
      },
      accountHolderName: {
        type: String,
        required: [true, 'Tên chủ tài khoản là bắt buộc'],
        uppercase: true,
        trim: true
      },
    },
    payos: {
      clientId: { type: String, trim: true, select: false },
      apiKey: { type: String, trim: true, select: false },
      checksumKey: { type: String, trim: true, select: false },
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['CCCD', 'BUSINESS_LICENSE', 'SERVICE_IMAGE'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        publicId: String, // Cloudinary public_id để xóa sau này
        title: String, // VD: "CCCD mặt trước", "Giấy phép kinh doanh"
        description: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    adminNotes: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('OwnerApplication', ownerApplicationSchema);