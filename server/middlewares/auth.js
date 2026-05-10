import clerkClient from '../utils/clerkClient.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

export const verifyClerkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1].trim();
    const decoded = await clerkClient.verifyToken(token);
    const clerkId = decoded.sub;

    // 1. Tìm User trong MongoDB
    let user = await User.findOne({ clerkId });

    if (user && user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để biết thêm chi tiết.'
      });
    }

    // 2. Nếu chưa có (Đăng nhập lần đầu) -> Tạo mới và xử lý Avatar
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      // Lấy link ảnh từ Clerk (Hỗ trợ cả bản SDK mới và cũ)
      const rawClerkImage = clerkUser.imageUrl || clerkUser.profileImageUrl;

      // Khai báo biến finalAvatar bằng let ở scope ngoài cùng của khối if(!user)
      let finalAvatar = rawClerkImage;

      if (rawClerkImage) {
        console.log("👉 Đang chuẩn bị upload link này lên Cloudinary:", rawClerkImage);
        try {
          const uploadRes = await cloudinary.uploader.upload(rawClerkImage, {
            folder: 'dpulse/avatars',
            transformation: [
              { width: 256, height: 256, crop: 'fill' },
              { quality: 'auto:best', fetch_format: 'auto' }
            ]
          });
          finalAvatar = uploadRes.secure_url;
          console.log(`☁️ Đã upload avatar lên Cloudinary thành công!`);
        } catch (imgErr) {
          console.log("❌ Lỗi upload Cloudinary (Vẫn dùng ảnh mặc định Clerk):");
          // Ép in ra toàn bộ object lỗi, không bỏ sót thuộc tính nào
          console.dir(imgErr, { depth: null });
        }
      }

      // 👉 TẠO MỚI USER TRONG MONGODB
      user = await User.create({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        avatar: finalAvatar, // Sử dụng biến finalAvatar đã được xử lý ở trên
        role: 'USER',
      });
      console.log(`✨ Đã tạo user mới trong MongoDB: ${user.email}`);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Clerk Verification Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// MIDDLEWARE: Kiểm tra quyền Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    next(new ApiError(403, 'Forbidden: Chỉ Admin mới có quyền thực hiện hành động này.'));
  }
};