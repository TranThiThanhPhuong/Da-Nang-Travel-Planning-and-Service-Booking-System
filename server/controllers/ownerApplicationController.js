import OwnerApplication from "../models/OwnerApplication.js";
import User from "../models/User.js";
import clerkClient from "../utils/clerkClient.js";

// @desc    Upload documents for owner application
// @route   POST /api/owner-applications/upload
// @access  Private
export const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có file nào được tải lên",
      });
    }

    const metadata = JSON.parse(req.body.metadata || "[]");

    // Map files với metadata
    const documents = req.files.map((file, index) => {
      if (!file.mimetype.startsWith("image/")) {
        throw new Error("Chỉ cho phép upload file ảnh");
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

    res.json({
      success: true,
      data: documents,
      message: `Đã tải lên ${documents.length} tài liệu`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit owner application
// @route   POST /api/owner-applications
// @access  Private
export const submitApplication = async (req, res) => {
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
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc hoặc chưa cấu hình PayOS đầy đủ",
      });
    }

    const existingApp = await OwnerApplication.findOne({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (existingApp && existingApp.status === "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Bạn đã có đơn đang chờ duyệt.",
      });
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

    res.status(201).json({
      success: true,
      data: application,
      message: "Đơn đăng ký đã được gửi thành công",
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all applications (Admin only)
// @route   GET /api/owner-applications
// @access  Private/Admin
export const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await OwnerApplication.find(filter)
      .populate("userId", "fullName email clerkId")
      .sort({ createdAt: -1 });

    const sanitizedApplications = applications.map((app) => {
      delete app.payos; // Xóa bỏ hoàn toàn object chứa key (nếu có rò rỉ)
      return {
        ...app,
        payosStatus: "Đã cấu hình đầy đủ thông tin cổng PayOS ✓", // Gửi text này về cho Admin hiển thị trên giao diện bảng (Table)
      };
    });

    res.json({
      success: true,
      count: sanitizedApplications.length,
      data: sanitizedApplications,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Review application (Admin only)
// @route   PATCH /api/owner-applications/:id
// @access  Private/Admin
export const reviewApplication = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const { id } = req.params;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const application = await OwnerApplication.findByIdAndUpdate(
      id,
      { status, adminNotes, reviewedAt: Date.now() },
      { new: true },
    ).populate("userId", "fullName email clerkId").lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn",
      });
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

    res.json({
      success: true,
      message: `Đã ${status === "APPROVED" ? "duyệt" : "từ chối"} đơn đăng ký`,
      data: application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my application status
// @route   GET /api/owner-applications/my-status
// @access  Private
export const getMyApplicationStatus = async (req, res) => {
  try {
    const application = await OwnerApplication.findOne({
      userId: req.user._id,
    })
    .select("+payos.clientId +payos.apiKey +payos.checksumKey")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Get my status error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete/Cancel application
// @route   DELETE /api/owner-applications/:id
// @access  Private
export const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await OwnerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đăng ký",
      });
    }

    // Chỉ cho phép user tự hủy đơn của mình
    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy đơn này",
      });
    }

    // Chỉ cho phép hủy đơn PENDING
    if (application.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy đơn đang chờ duyệt",
      });
    }

    await application.deleteOne();

    res.json({
      success: true,
      message: "Đã hủy đơn đăng ký thành công",
    });
  } catch (error) {
    console.error("Cancel application error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};