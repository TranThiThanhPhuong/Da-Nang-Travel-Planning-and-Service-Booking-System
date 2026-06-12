import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CreditCard,
  FileText,
  Send,
  ShieldCheck,
  MapPin,
  UserCheck,
  X,
  Plus,
  Loader2,
  Sparkles,
  LayoutDashboard,
  CalendarDays,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileCheck,
  RefreshCcw,
  EyeOff,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ApplicationDetailModal from "./modalsUser/ApplicationDetailModal";
import CancelConfirmModal from "./modalsUser/CancelConfirmModal";

const BecomePartner = ({ dbUser }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const navigate = useNavigate();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const isPending = status?.status === "PENDING";
  const isRejected = status?.status === "REJECTED";
  const isApproved = status?.status === "APPROVED";

  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    phoneNumber: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    clientId: "",
    apiKey: "",
    checksumKey: "",
  });

  const [files, setFiles] = useState({
    CCCD: [],
    BUSINESS_LICENSE: [],
    SERVICE_IMAGE: [],
  });

  useEffect(() => {
    const checkStatus = async () => {
      setStatusLoading(true);
      try {
        const token = await getToken();
        const res = await axios.get("/api/owner-applications/my-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.data) setStatus(res.data.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, [getToken]);

  const [errors, setErrors] = useState({});

  const [showKeys, setShowKeys] = useState({
    clientId: false,
    apiKey: false,
    checksumKey: false,
  });

  const toggleKeyVisibility = (key) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateNew = () => {
    setStatus(null);
    setFormData({
      businessName: "",
      businessAddress: "",
      phoneNumber: "",
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      clientId: "",
      apiKey: "",
      checksumKey: "",
    });
    setFiles({
      CCCD: [],
      BUSINESS_LICENSE: [],
      SERVICE_IMAGE: [],
    });
  };

  const validateAll = () => {
    let newErrors = {};

    Object.entries(formData).forEach(([key, value]) => {
      let error = "";

      if (key === "phoneNumber") {
        const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;
        if (!phoneRegex.test(value)) error = "Số điện thoại không hợp lệ.";
      }

      if (key === "accountNumber") {
        const bankRegex = /^[0-9]{6,15}$/;
        if (!bankRegex.test(value)) error = "Số tài khoản không hợp lệ.";
      }

      if (key === "accountHolderName") {
        const nameRegex = /^[A-Z\s]{3,50}$/;
        if (!nameRegex.test(value)) error = "Tên phải IN HOA KHÔNG DẤU.";
      }

      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name, value) => {
    let error = "";
    if (name === "phoneNumber") {
      const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/; // Chuẩn SĐT Việt Nam
      if (!phoneRegex.test(value))
        error = "Số điện thoại không hợp lệ (10 số).";
    }
    if (name === "accountNumber") {
      const bankRegex = /^[0-9]{6,15}$/; // Số tài khoản thường từ 6-15 số
      if (!bankRegex.test(value))
        error = "Số tài khoản chỉ bao gồm số (6-15 ký tự).";
    }
    if (name === "accountHolderName") {
      const nameRegex = /^[A-Z ]+$/; // Chỉ chữ in hoa không dấu
      if (!nameRegex.test(value)) error = "Tên phải là chữ IN HOA KHÔNG DẤU.";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const formattedValue =
      name === "accountHolderName" ? value.toUpperCase() : value;

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    validateField(name, formattedValue);
  };

  const handleFileChange = (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    const limits = { CCCD: 2, BUSINESS_LICENSE: 15, SERVICE_IMAGE: 15 };

    setFiles((prev) => ({
      ...prev,
      [type]: [...prev[type], ...selectedFiles].slice(0, limits[type]),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateAll();
    if (!isValid) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Thông báo",
        message: "Vui lòng sửa lỗi trước khi gửi!",
      });
      return;
    }
    if (files.CCCD.length !== 2) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Thiếu tài liệu",
        message: "Vui lòng tải lên đúng 2 ảnh CCCD!",
      });
      return;
    }
    if (files.BUSINESS_LICENSE.length === 0) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Thiếu tài liệu",
        message: "Vui lòng tải ít nhất 1 giấy phép kinh doanh!",
      });
      return;
    }

    // Kiểm tra nhanh 3 key PayOS bắt buộc nhập ở FE
    if (!formData.clientId || !formData.apiKey || !formData.checksumKey) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Thiếu cấu hình",
        message: "Vui lòng điền đầy đủ 3 Key kết nối từ PayOS!",
      });
      return;
    }

    // Bật modal loading
    setModalConfig({
      isOpen: true,
      type: "loading",
      title: "Đang xử lý",
      message: "Vui lòng chờ trong giây lát...",
    });

    try {
      const token = await getToken();
      const allFiles = [];
      const metadata = [];

      Object.keys(files).forEach((type) => {
        files[type].forEach((file, index) => {
          allFiles.push(file);
          metadata.push({
            type: type,
            title: `${type}_${index + 1}`,
          });
        });
      });

      const uploadData = new FormData();
      allFiles.forEach((file) => uploadData.append("files", file));
      uploadData.append("metadata", JSON.stringify(metadata));

      const uploadRes = await axios.post(
        "/api/owner-applications/upload",
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const finalData = {
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        phoneNumber: formData.phoneNumber,
        bankAccount: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
        },
        // Đóng gói PayOS gửi đi
        payos: {
          clientId: formData.clientId.trim(),
          apiKey: formData.apiKey.trim(),
          checksumKey: formData.checksumKey.trim(),
        },
        documents: uploadRes.data.data,
      };

      const res = await axios.post("/api/owner-applications", finalData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatus(res.data.data);
      setModalConfig({
        isOpen: true,
        type: "success",
        title: "Thành công",
        message: "Đơn đăng ký của bạn đã được gửi và đang chờ Admin phê duyệt!",
      });
      handleCreateNew(); // Xóa sạch form sau khi gửi thành công
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "Có lỗi xảy ra trong quá trình gửi đơn.";
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Thất bại",
        message: errMsg,
      });
    }
  };

  const handleCancelApplication = async () => {
    setCancelLoading(true);
    try {
      const token = await getToken();
      await axios.delete(`/api/owner-applications/${status._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Đã hủy đơn đăng ký thành công!");
      setShowCancelModal(false);
      setStatus(null);
      handleCreateNew();
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi khi hủy đơn");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  };

  const removeFile = (type, index) => {
    setFiles((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const inputLabel =
    "text-[10px] font-black text-[#004D40]/40 uppercase tracking-[0.2em] ml-1 mb-2 block";
  const inputStyle =
    "w-full bg-[#F5F5F5] border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl p-4 outline-none focus:ring-2 focus:ring-[#FFAB40]/50 font-bold text-[#004D40] placeholder:text-gray-300 transition-all shadow-inner";

  const ImagePreview = ({ type, icon: Icon, label }) => (
    <div className="space-y-4">
      <label className={inputLabel}>{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {files[type].map((file, index) => (
          <div
            key={index}
            className="relative group aspect-video rounded-xl overflow-hidden border-2 border-[#004D40]/10"
          >
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeFile(type, index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {(type === "CCCD"
          ? files[type].length < 2
          : files[type].length < 15) && (
          <label className="border-2 border-dashed border-[#E0F2F1] rounded-tr-2xl rounded-bl-2xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-[#FFAB40] hover:bg-gray-50 transition-all group">
            <Icon
              className="text-[#004D40]/20 group-hover:text-[#FFAB40] mb-2"
              size={24}
            />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
              Thêm ảnh
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, type)}
            />
          </label>
        )}
      </div>
    </div>
  );

  const getWaitingTime = () => {
    if (!status?.createdAt) return "Chưa rõ";
    const now = new Date();
    const created = new Date(status.createdAt);
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} ngày`;
    if (diffHours > 0) return `${diffHours} giờ`;
    return "Vừa gửi";
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004D40]" size={48} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-28 pb-10 px-6">
        <div className="max-w-5xl mx-auto">
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-block p-3 bg-[#FFAB40]/10 rounded-full mb-4">
              <Clock className="text-[#FFAB40] animate-pulse" size={40} />
            </div>
            <h1 className="text-4xl font-cormorant font-bold text-[#004D40] mb-3">
              Hồ sơ đang được thẩm định
            </h1>
            <p className="text-[#004D40]/60 font-medium">
              Chào{" "}
              <span className="text-[#004D40] font-bold">
                {status.businessName}
              </span>
              , hồ sơ của bạn đang được xử lý bởi đội ngũ D-PULSE.
            </p>
          </motion.div>

          {/* TIMELINE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl p-8 mb-8 shadow-xl border border-white/60"
          >
            <h3 className="text-lg font-bold text-[#004D40] mb-6">
              Tiến độ xử lý
            </h3>

            <div className="flex justify-between items-center relative">
              <div className="absolute top-6 left-0 w-full h-[2px] bg-gray-200 z-0"></div>

              {[
                {
                  label: "Gửi đơn",
                  icon: Send,
                  done: true,
                  time: getWaitingTime(),
                },
                {
                  label: "Thẩm định",
                  icon: ShieldCheck,
                  active: true,
                  time: "Đang xử lý",
                },
                {
                  label: "Hoàn tất",
                  icon: CheckCircle2,
                  done: false,
                  time: "~24h",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg mb-2 transition-all ${
                      step.done
                        ? "bg-[#00C853] text-white"
                        : step.active
                          ? "bg-[#FFAB40] text-white animate-pulse"
                          : "bg-white text-gray-300 border-2 border-gray-200"
                    }`}
                  >
                    <step.icon size={20} />
                  </div>
                  <span
                    className={`text-xs font-bold uppercase ${
                      step.active ? "text-[#FFAB40]" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[9px] text-gray-400 mt-1">
                    {step.time}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl p-6 border border-white/60 shadow-lg"
            >
              <CalendarDays className="text-[#004D40] mb-3" size={24} />
              <p className="text-xs text-gray-500 font-bold uppercase">
                Thời gian chờ
              </p>
              <p className="text-2xl font-black text-[#004D40] mt-1">
                {getWaitingTime()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl p-6 border border-white/60 shadow-lg"
            >
              <FileCheck className="text-[#FFAB40] mb-3" size={24} />
              <p className="text-xs text-gray-500 font-bold uppercase">
                Tài liệu đã gửi
              </p>
              <p className="text-2xl font-black text-[#004D40] mt-1">
                {status.documents?.length || 0} files
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl p-6 border border-white/60 shadow-lg"
            >
              <Clock className="text-blue-500 mb-3" size={24} />
              <p className="text-xs text-gray-500 font-bold uppercase">
                Dự kiến hoàn tất
              </p>
              <p className="text-2xl font-black text-[#004D40] mt-1">
                {new Date(
                  new Date(status.createdAt).getTime() + 24 * 60 * 60 * 1000,
                ).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </motion.div>
          </div>

          {/* ACTIONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl p-8 shadow-xl border border-white/60"
          >
            <h3 className="text-lg font-bold text-[#004D40] mb-6">
              Quản lý hồ sơ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowDetailModal(true)}
                className="bg-[#004D40] hover:bg-[#00332A] text-white font-bold py-4 rounded-tr-2xl rounded-bl-2xl flex items-center justify-center gap-3 transition-all shadow-lg"
              >
                <Eye size={20} />
                Xem chi tiết hồ sơ
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-tr-2xl rounded-bl-2xl flex items-center justify-center gap-3 transition-all border-2 border-red-200"
              >
                <Trash2 size={20} />
                Hủy đơn đăng ký
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-tr-2xl rounded-bl-2xl rounded-tl-xl rounded-br-xl">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="text-blue-500 shrink-0 mt-0.5"
                  size={18}
                />
                <div className="text-sm text-blue-700">
                  <p className="font-bold mb-1">Lưu ý quan trọng:</p>
                  <p>
                    • Không thể chỉnh sửa hồ sơ sau khi gửi (để đảm bảo tính
                    minh bạch)
                  </p>
                  <p>
                    • Nếu cần thay đổi, vui lòng <strong>Hủy đơn</strong> và gửi
                    lại hồ sơ mới
                  </p>
                  <p>• Thời gian xử lý trung bình: 12-24 giờ làm việc</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* DETAIL MODAL */}
        <AnimatePresence>
          {showDetailModal && (
            <ApplicationDetailModal
              application={status}
              onClose={() => setShowDetailModal(false)}
            />
          )}
        </AnimatePresence>

        {/* CANCEL MODAL */}
        <AnimatePresence>
          {showCancelModal && (
            <CancelConfirmModal
              onClose={() => setShowCancelModal(false)}
              onConfirm={handleCancelApplication}
              isLoading={cancelLoading}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-28 pb-10 px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl p-12 max-w-2xl w-full shadow-2xl border border-red-100"
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-500" size={48} />
          </div>

          <h2 className="text-3xl font-cormorant font-bold text-[#004D40] text-center mb-3">
            Đơn đăng ký bị từ chối
          </h2>

          <p className="text-center text-[#004D40]/60 mb-8">
            Rất tiếc, hồ sơ của bạn chưa đáp ứng yêu cầu. Vui lòng xem lý do và
            gửi lại.
          </p>

          {status.adminNotes && (
            <div className="bg-red-50 border-2 border-red-200 rounded-tr-2xl rounded-bl-2xl rounded-tl-xl rounded-br-xl p-6 mb-8">
              <p className="text-xs font-bold text-red-700 uppercase mb-2">
                Lý do từ chối:
              </p>
              <p className="text-sm text-red-600 leading-relaxed">
                {status.adminNotes}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setShowDetailModal(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#004D40] font-bold py-3 rounded-tr-xl rounded-bl-xl transition-colors flex items-center justify-center gap-2"
            >
              <Eye size={18} />
              Xem hồ sơ
            </button>

            <button
              onClick={handleCreateNew}
              className="flex-1 bg-[#004D40] hover:bg-[#00332A] text-white font-bold py-3 rounded-tr-xl rounded-bl-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              Gửi đơn mới
            </button>
          </div>
        </motion.div>
        <AnimatePresence>
          {showDetailModal && (
            <ApplicationDetailModal
              application={status}
              onClose={() => setShowDetailModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isApproved) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-30 pb-10 flex justify-center px-6 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-[#004D40]/10 shadow-xl p-12 max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-[#004D40]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-[#FFAB40]" size={40} />
          </div>
          <h2 className="text-3xl font-cormorant font-bold text-[#004D40] mb-4">
            Chúc mừng! Bạn đã là Đối Tác của D-PULSE
          </h2>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            Hồ sơ của bạn đã được duyệt thành công. Hãy bắt đầu quản lý dịch vụ
            của bạn ngay.
          </p>
          <button
            onClick={() => navigate("/owner")}
            className="w-full bg-[#004D40] text-white py-4 rounded-tr-2xl rounded-bl-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#00332A] transition-all"
          >
            <LayoutDashboard size={18} />
            Đi tới Owner Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (dbUser?.role === "OWNER" || dbUser?.role === "ADMIN") {
    const isAdmin = dbUser.role === "ADMIN";
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-30 pb-10 flex justify-center px-6 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-[#004D40]/10 shadow-xl p-12 max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-[#004D40]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-[#FFAB40]" size={40} />
          </div>

          <h2 className="text-3xl font-cormorant font-bold text-[#004D40] mb-4">
            {isAdmin ? "Chào Quản Trị Viên!" : "Bạn đã là Đối Tác!"}
          </h2>

          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            {isAdmin
              ? "Tài khoản của bạn có quyền quản trị hệ thống. Bạn không cần đăng ký làm đối tác."
              : "Tài khoản này đã được kích hoạt quyền Đối tác (Owner). Hãy bắt đầu quản lý dịch vụ của bạn ngay."}
          </p>

          <button
            onClick={() => navigate(isAdmin ? "/admin" : "/owner")}
            className="w-full bg-[#004D40] text-white py-4 rounded-tr-2xl rounded-bl-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#00332A] transition-all"
          >
            <LayoutDashboard size={18} />
            Đi tới {isAdmin ? "Admin Dashboard" : "Owner Dashboard"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen font-jakarta pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <h1 className="text-5xl font-cormorant font-bold text-[#004D40]">
            Hợp tác cùng D-PULSE
          </h1>
          <p className="text-[#004D40]/60 mt-4 font-medium text-lg italic">
            "Đưa nhịp đập kinh doanh của bạn hòa vào dòng chảy du lịch Đà Nẵng."
          </p>
        </motion.div>
        {/* ================= KHỐI 1: GIÁ TRỊ LỢI ÍCH (WHY PARTNER WITH US) ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12"
        >
          {/* Lợi ích 1 */}
          <div className="bg-white border border-gray-100 p-6 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:shadow-[0_10px_30px_rgba(0,77,64,0.05)] transition-all duration-300">
            <div className="w-12 h-12 bg-[#E0F2F1] text-[#004D40] rounded-xl flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              📈
            </div>
            <h3 className="font-cormorant font-bold text-xl text-[#004D40] mb-2">
              Bùng nổ Doanh thu
            </h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Tiếp cận trực tiếp tệp khách hàng mục tiêu đang tìm kiếm dịch vụ
              lưu trú, tour du lịch và ẩm thực tại Đà Nẵng mỗi ngày.
            </p>
          </div>

          {/* Lợi ích 2 */}
          <div className="bg-white border border-gray-100 p-6 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:shadow-[0_10px_30px_rgba(0,77,64,0.05)] transition-all duration-300">
            <div className="w-12 h-12 bg-amber-50 text-[#FFAB40] rounded-xl flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h3 className="font-cormorant font-bold text-xl text-[#004D40] mb-2">
              Quản lý Tồn kho Thông minh
            </h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Hệ thống SaaS cung cấp công cụ tự động cập nhật số lượng slot,
              phòng trống và lịch trình theo thời gian thực (Real-time).
            </p>
          </div>

          {/* Lợi ích 3 */}
          <div className="bg-white border border-gray-100 p-6 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:shadow-[0_10px_30px_rgba(0,77,64,0.05)] transition-all duration-300">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              🤝
            </div>
            <h3 className="font-cormorant font-bold text-xl text-[#004D40] mb-2">
              Đối soát Tài chính Minh bạch
            </h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Hệ thống đối soát doanh thu tự động, thanh toán định kỳ nhanh
              chóng qua các cổng an toàn, không lo đọng vốn.
            </p>
          </div>
        </motion.div>

        {/* ================= KHỐI 2: QUY TRÌNH BA BƯỚC (HOW IT WORKS) ================= */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_10px_40px_rgba(0,0,0,0.02)] p-8 mb-12"
        >
          <h2 className="text-center font-cormorant font-bold text-2xl text-[#004D40] mb-8">
            Quy trình 3 bước để bắt đầu kinh doanh
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Bước 1 */}
            <div className="text-center relative">
              <span className="text-5xl font-cormorant font-black text-[#E0F2F1] block mb-2">
                01
              </span>
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                Nộp hồ sơ pháp lý
              </h4>
              <p className="text-[11px] text-gray-400 font-medium max-w-[200px] mx-auto">
                Điền thông tin doanh nghiệp và tải lên giấy phép đăng ký kinh
                doanh.
              </p>
            </div>

            {/* Bước 2 */}
            <div className="text-center relative">
              <span className="text-5xl font-cormorant font-black text-[#FFE0B2] block mb-2">
                02
              </span>
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                Hệ thống xét duyệt
              </h4>
              <p className="text-[11px] text-gray-400 font-medium max-w-[200px] mx-auto">
                Tổng Admin kiểm tra tính pháp lý của hồ sơ trong vòng 24h làm
                việc.
              </p>
            </div>

            {/* Bước 3 */}
            <div className="text-center relative">
              <span className="text-5xl font-cormorant font-black text-indigo-100 block mb-2">
                03
              </span>
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                Đăng tải & Vận hành
              </h4>
              <p className="text-[11px] text-gray-400 font-medium max-w-[200px] mx-auto">
                Nhận thông báo chấp thuận, mở khóa tính năng đối tác và bắt đầu
                đón khách!
              </p>
            </div>
          </div>
        </motion.div>
        {/* ================= KHỐI THỐNG KÊ ĐỘNG (SOCIAL PROOF STATS) ================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-[#004D40] text-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl p-8 my-10 shadow-[0_20px_50px_rgba(0,77,64,0.15)] relative overflow-hidden"
        >
          {/* Các đường vân trang trí chìm phía sau tạo chiều sâu */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FFAB40]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            {/* Chỉ số 1 */}
            <div className="pt-4 md:pt-0">
              <h3 className="text-3xl md:text-4xl font-cormorant font-black text-[#FFAB40]">
                250+
              </h3>
              <p className="text-[10px] md:text-xs text-white/70 font-bold uppercase tracking-widest mt-1">
                Chủ doanh nghiệp
              </p>
              <p className="text-[9px] text-teal-200/50 mt-0.5 font-medium">
                Đã kích hoạt gian hàng
              </p>
            </div>

            {/* Chỉ số 2 */}
            <div className="pt-4 md:pt-0">
              <h3 className="text-3xl md:text-4xl font-cormorant font-black text-white">
                45,000+
              </h3>
              <p className="text-[10px] md:text-xs text-white/70 font-bold uppercase tracking-widest mt-1">
                Người dùng tích cực
              </p>
              <p className="text-[9px] text-teal-200/50 mt-0.5 font-medium">
                Tìm kiếm dịch vụ mỗi tháng
              </p>
            </div>

            {/* Chỉ số 3 */}
            <div className="pt-4 md:pt-0">
              <h3 className="text-3xl md:text-4xl font-cormorant font-black text-white">
                15,000+
              </h3>
              <p className="text-[10px] md:text-xs text-white/70 font-bold uppercase tracking-widest mt-1">
                Chuyến đi được lên lịch
              </p>
              <p className="text-[9px] text-teal-200/50 mt-0.5 font-medium">
                Thông qua công cụ TripPlanner
              </p>
            </div>

            {/* Chỉ số 4 */}
            <div className="pt-4 md:pt-0">
              <h3 className="text-3xl md:text-4xl font-cormorant font-black text-[#FFAB40]">
                98%
              </h3>
              <p className="text-[10px] md:text-xs text-white/70 font-bold uppercase tracking-widest mt-1">
                Tỷ lệ hài lòng
              </p>
              <p className="text-[9px] text-teal-200/50 mt-0.5 font-medium">
                Từ các đối tác vận hành SaaS
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white/80 backdrop-blur-xl rounded-tr-[60px] rounded-bl-[60px] rounded-tl-2xl rounded-br-2xl p-10 md:p-16 shadow-2xl border border-white">
          <form className="space-y-12" onSubmit={handleSubmit}>
            {/* SECTION: BUSINESS INFO */}
            <section>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#004D40] text-[#FFAB40] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center shadow-lg">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-cormorant font-bold text-[#004D40]">
                    Thông tin cơ sở
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Hồ sơ pháp nhân doanh nghiệp
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className={inputLabel}>Tên cơ sở kinh doanh</label>
                  <input
                    required
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="VD: D-Pulse Marina Danang"
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={inputLabel}>Số điện thoại kinh doanh</label>
                  <input
                    required
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="0905 XXX XXX"
                    className={`${inputStyle} ${errors.phoneNumber ? "border-red-500 ring-1 ring-red-500" : ""}`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1 font-bold">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={inputLabel}>Địa chỉ trụ sở</label>
                  <div className="relative">
                    <MapPin
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFAB40]"
                      size={18}
                    />
                    <input
                      required
                      name="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="Số nhà, đường, phường, quận, Đà Nẵng"
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION: BANKING INFO */}
            <section>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#004D40] text-[#FFAB40] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center shadow-lg">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-cormorant font-bold text-[#004D40]">
                    Tài khoản thụ hưởng & Cổng thanh toán
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Cấu hình ngân hàng đối soát và tích hợp cổng PayOS
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className={inputLabel}>Ngân hàng</label>
                  <input
                    required
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="VD: Vietcombank"
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={inputLabel}>Số tài khoản</label>
                  <input
                    required
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="0123 456 789"
                    className={`${inputStyle} ${errors.accountNumber ? "border-red-500 ring-1 ring-red-500" : ""}`}
                  />
                  {errors.accountNumber && (
                    <p className="text-red-500 text-xs mt-1 font-bold">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={inputLabel}>
                    Chủ tài khoản (In hoa không dấu)
                  </label>
                  <input
                    required
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="LE VAN TUAN LOC"
                    className={`${inputStyle} ${errors.accountHolderName ? "border-red-500 ring-1 ring-red-500" : ""}`}
                  />
                  {errors.accountHolderName && (
                    <p className="text-red-500 text-xs mt-1 font-bold">
                      {errors.accountHolderName}
                    </p>
                  )}
                </div>
              </div>

              {/* Cấu hình cổng kết nối PayOS */}
              <div className="mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#004D40]">
                      Thông tin kết nối PayOS
                    </h3>
                    <p className="text-xs text-gray-400">
                      Các khóa bảo mật để tích hợp tính năng tự động tạo mã
                      VietQR
                    </p>
                  </div>
                  <a
                    href="https://payos.vn/docs/huong-dan-su-dung/tao-kenh-thanh-toan/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#FFAB40] hover:underline flex items-center gap-1 bg-[#004D40]/5 px-3 py-1.5 rounded-full w-fit"
                  >
                    <span>Chưa có key? Hướng dẫn lấy Key PayOS ↗</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CLIENT ID INPUT */}
                  <div>
                    <label className={inputLabel}>Client ID</label>
                    <div className="relative">
                      <input
                        required
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleInputChange}
                        type={showKeys.clientId ? "text" : "password"}
                        placeholder="Nhập Client ID"
                        className={`${inputStyle} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility("clientId")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys.clientId ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* API KEY INPUT */}
                  <div>
                    <label className={inputLabel}>API Key</label>
                    <div className="relative">
                      <input
                        required
                        name="apiKey"
                        value={formData.apiKey}
                        onChange={handleInputChange}
                        type={showKeys.apiKey ? "text" : "password"}
                        placeholder="Nhập API Key"
                        className={`${inputStyle} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility("apiKey")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys.apiKey ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CHECKSUM KEY INPUT */}
                  <div>
                    <label className={inputLabel}>Checksum Key</label>
                    <div className="relative">
                      <input
                        required
                        name="checksumKey"
                        value={formData.checksumKey}
                        onChange={handleInputChange}
                        type={showKeys.checksumKey ? "text" : "password"}
                        placeholder="Nhập Checksum Key"
                        className={`${inputStyle} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility("checksumKey")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys.checksumKey ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION: UPLOADS */}
            <section>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#004D40] text-[#FFAB40] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center shadow-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-cormorant font-bold text-[#004D40]">
                    Hồ sơ xác minh
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Giấy tờ chứng thực kinh doanh
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <ImagePreview
                  type="CCCD"
                  icon={UserCheck}
                  label="Ảnh CCCD / Passport (Bắt buộc 2 ảnh mặt trước/sau)"
                />
                <ImagePreview
                  type="BUSINESS_LICENSE"
                  icon={ShieldCheck}
                  label="Giấy phép kinh doanh (Tối đa 15)"
                />
                <ImagePreview
                  type="SERVICE_IMAGE"
                  icon={Plus}
                  label="Ảnh thực tế dịch vụ/cơ sở (Tối đa 15)"
                />
              </div>
            </section>

            <div className="pt-6">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#004D40] text-white py-5 rounded-tr-3xl rounded-bl-3xl font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-[#004D40]/30 flex items-center justify-center gap-4 hover:bg-[#002B24] transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={20} /> Gửi hồ sơ xét duyệt
                  </>
                )}
              </motion.button>
              <p className="text-center mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-10 leading-relaxed">
                Hồ sơ sẽ được Quản trị viên phản hồi trong vòng 24h làm việc.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomePartner;
