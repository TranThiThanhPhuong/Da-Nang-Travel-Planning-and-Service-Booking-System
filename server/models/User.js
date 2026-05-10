import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: [true, 'Clerk ID là bắt buộc'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    fullName: {
      type: String,
      required: [true, 'Tên người dùng là bắt buộc'],
      trim: true,
    },
    avatar: {
      type: String,
      default: "https://i.pinimg.com/736x/91/53/5b/91535bc90a800b532116028457cdd0f9.jpg", // Ảnh mặc định nếu user không có
    },
    role: {
      type: String, enum: ['USER', 'OWNER', 'ADMIN'],
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
    currentPackage: {
      type: String,
      enum: ['STARTER', 'PRO', 'ULTIMATE'],
      default: 'STARTER', // Mặc định ai lên Owner cũng có gói Starter
    },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED'],
      default: 'ACTIVE',
    },
    subscriptionEndDate: {
      type: Date, // Thời hạn của gói (Dùng để hiển thị trong Admin Dashboard)
    },
    preferences: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ fullName: 'text', email: 'text' });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;