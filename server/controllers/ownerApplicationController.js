import OwnerApplication from "../models/OwnerApplication.js";
import User from "../models/User.js";
import clerkClient from "../utils/clerkClient.js";
import { sendNotification } from '../utils/notificationHelper.js';
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// @desc    Upload documents for owner application
// @route   POST /api/owner-applications/upload
// @access  Private
export const uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "Không có file nào được tải lên");
    }

    const metadata = JSON.parse(req.body.metadata || "[]");

    // Map files với metadata
    const documents = req.files.map((file, index) => {
      if (!file.mimetype.startsWith("image/")) {
        throw new ApiError(400, "Chỉ cho phép upload file ảnh");
      }
      const meta = metadata[index] || {};
      return {
        type: meta.type || "SERVICE_IMAGE",
        url: file.path, // Cloudinary URL
        publicId: file.filename,
        title: meta.title || file.originalname,
        description: meta.description || "",
      };
    });

    return ApiResponse.send(
      res,
      200,
      `Đã tải lên ${documents.length} tài liệu`,
      documents
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Submit owner application
// @route   POST /api/owner-applications
// @access  Private
export const submitApplication = async (req, res, next) => {
  try {
    const {
      businessName,
      businessAddress,
      phoneNumber,
      bankAccount,
      payos,
      documents,
    } = req.body;

    if (!businessName || !phoneNumber || !bankAccount?.accountNumber || !payos?.clientId || !payos?.apiKey || !payos?.checksumKey) {
      throw new ApiError(400, "Thiếu thông tin bắt buộc hoặc chưa cấu hình PayOS đầy đủ");
    }

    const existingApp = await OwnerApplication.findOne({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (existingApp && existingApp.status === "PENDING") {
      throw new ApiError(400, "Bạn đã có đơn đang chờ duyệt.");
    }

    const application = await OwnerApplication.create({
      userId: req.user._id,
      businessName,
      businessAddress,
      phoneNumber,
      bankAccount,
      payos,
      documents,
    });

    const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
    const adminIds = admins.map(admin => admin._id);

    await sendNotification({
      recipientId: adminIds,
      recipientRole: 'ADMIN',
      title: '📑 Có chủ dịch vụ mới chờ phê duyệt',
      content: `Đối tác vừa tạo chủ dịch vụ mới: "${businessName}". Vui lòng kiểm tra và phê duyệt.`,
      category: 'SYSTEM_ALERT',
      onClickUrl: '/admin/owners',
      metadata: { applicationId: application._id }
    });

    return ApiResponse.send(res, 201, "Đơn đăng ký đã được gửi thành công", application);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications (Admin only)
// @route   GET /api/owner-applications
// @access  Private/Admin
export const getAllApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const applications = await OwnerApplication.find(filter)
      .populate("userId", "fullName email clerkId avatar") // Lấy thêm avatar để hiển thị 
      .sort({ createdAt: -1 })
      .lean();

    const sanitizedApplications = applications.map((app) => {
      if (app.payos) {
        delete app.payos;
      }

      return {
        ...app,
        payosStatus: "Đã cấu hình đầy đủ thông tin cổng PayOS ✓",
      };
    });

    return ApiResponse.send(res, 200, "Lấy danh sách hồ sơ thành công", sanitizedApplications, {
      count: sanitizedApplications.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review application (Admin only)
// @route   PATCH /api/owner-applications/:id
// @access  Private/Admin
export const reviewApplication = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const { id } = req.params;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new ApiError(400, "Trạng thái không hợp lệ");
    }

    const application = await OwnerApplication.findByIdAndUpdate(
      id,
      { status, adminNotes, reviewedAt: Date.now() },
      { new: true },
    ).populate("userId", "fullName email clerkId").lean();

    if (!application) {
      throw new ApiError(404, "Không tìm thấy đơn");
    }

    // Nếu APPROVED -> Nâng cấp User
    if (status === "APPROVED") {
      const user = await User.findById(application.userId);
      if (user && user.role !== "ADMIN") {
        user.role = "OWNER";
        await user.save();

        try {
          await clerkClient.users.updateUserMetadata(user.clerkId, {
            publicMetadata: { role: "OWNER" },
          });
          console.log(`✅ Đã nâng cấp ${user.email} lên OWNER`);
        } catch (err) {
          console.error("Clerk Sync Error:", err.message);
        }
      }
    }

    delete application.payos;
    application.payosStatus = "Đã cấu hình đầy đủ thông tin cổng PayOS ✓";

    return ApiResponse.send(
      res,
      200,
      `Đã ${status === "APPROVED" ? "duyệt" : "từ chối"} đơn đăng ký`,
      application
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get my application status
// @route   GET /api/owner-applications/my-status
// @access  Private
export const getMyApplicationStatus = async (req, res, next) => {
  try {
    const application = await OwnerApplication.findOne({
      userId: req.user._id,
    })
      .select("+payos.clientId +payos.apiKey +payos.checksumKey")
      .sort({ createdAt: -1 });

    return ApiResponse.send(res, 200, "Lấy thông tin trạng thái hồ sơ thành công", application);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Cancel application
// @route   DELETE /api/owner-applications/:id
// @access  Private
export const cancelApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await OwnerApplication.findById(id);

    if (!application) {
      throw new ApiError(404, "Không tìm thấy đơn đăng ký");
    }

    // Chỉ cho phép user tự hủy đơn của mình
    if (application.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Bạn không có quyền hủy đơn này");
    }

    // Chỉ cho phép hủy đơn PENDING
    if (application.status !== "PENDING") {
      throw new ApiError(400, "Chỉ có thể hủy đơn đang chờ duyệt");
    }

    await application.deleteOne();

    return ApiResponse.send(res, 200, "Đã hủy đơn đăng ký thành công");
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin tài khoản ngân hàng và cổng PayOS hiện tại của Owner
// @route   GET /api/owner-applications/payment-config
// @access  Private (Chỉ đối tác)
export const getPaymentConfig = async (req, res, next) => {
  try {
    // Ép lấy các trường select: false bằng dấu cộng (+) phục vụ mục đích hiển thị cấu hình cho chính chủ sở hữu
    const application = await OwnerApplication.findOne({
      userId: req.user._id,
      status: 'APPROVED'
    }).select('+payos.clientId +payos.apiKey +payos.checksumKey').sort({ createdAt: -1 });

    if (!application) {
      throw new ApiError(404, "Không tìm thấy hồ sơ đối tác được phê duyệt của tài khoản này.");
    }

    // Che bớt thông tin key (Masking dữ liệu nhạy cảm gửi về client)
    const maskKey = (str) => {
      if (!str) return '';
      if (str.length <= 8) return '********';
      return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
    };

    const configData = {
      bankAccount: application.bankAccount,
      payos: {
        clientId: maskKey(application.payos?.clientId),
        apiKey: maskKey(application.payos?.apiKey),
        checksumKey: maskKey(application.payos?.checksumKey),
        // Gửi cờ kiểm tra xem DB đã có dữ liệu hay chưa để phục vụ UI placeholder/validation
        hasClientId: !!application.payos?.clientId,
        hasApiKey: !!application.payos?.apiKey,
        hasChecksumKey: !!application.payos?.checksumKey,
      }
    };

    return ApiResponse.send(res, 200, "Lấy thông tin cấu hình thanh toán thành công", configData);
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin cấu hình thanh toán PayOS và Ngân hàng
// @route   PUT /api/owner-applications/payment-config
// @access  Private (Chỉ đối tác)
export const updatePaymentConfig = async (req, res, next) => {
  try {
    const { bankAccount, payos } = req.body;

    // Validate nhanh dữ liệu đầu vào ngân hàng
    if (!bankAccount?.bankName || !bankAccount?.accountNumber || !bankAccount?.accountHolderName) {
      throw new ApiError(400, "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng thụ hưởng.");
    }

    // Tìm đơn đăng ký gần nhất đã được duyệt của Owner này
    const application = await OwnerApplication.findOne({
      userId: req.user._id,
      status: 'APPROVED'
    }).select('+payos.clientId +payos.apiKey +payos.checksumKey').sort({ createdAt: -1 });

    if (!application) {
      throw new ApiError(404, "Không tìm thấy hồ sơ đối tác hợp lệ để cập nhật cấu hình.");
    }

    // Cập nhật thông tin ngân hàng
    application.bankAccount = {
      bankName: bankAccount.bankName,
      accountNumber: bankAccount.accountNumber,
      accountHolderName: bankAccount.accountHolderName.toUpperCase().trim()
    };

    // Xử lý ghi đè PayOS: Chỉ ghi đè khi người dùng nhập chuỗi mới (không phải chuỗi đã mask dạng "...")
    if (payos?.clientId && !payos.clientId.includes('...')) {
      application.payos.clientId = payos.clientId;
    }
    if (payos?.apiKey && !payos.apiKey.includes('...')) {
      application.payos.apiKey = payos.apiKey;
    }
    if (payos?.checksumKey && !payos.checksumKey.includes('...')) {
      application.payos.checksumKey = payos.checksumKey;
    }

    await application.save();

    return ApiResponse.send(res, 200, "Cấu hình dòng tiền và cổng thanh toán đối tác cập nhật thành công.");
  } catch (error) {
    next(error);
  }
};