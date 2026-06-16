import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Camera, Loader2, AlertCircle } from "lucide-react";
import axios from "../../hooks/axios";

const ReviewModal = ({ isOpen, onClose, booking, onSuccess, getToken }) => {
  if (!isOpen || !booking) return null;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > 5) {
      setError("Bạn chỉ được tải lên tối đa 5 hình ảnh thực tế.");
      return;
    }

    setError("");

    const newImages = files.map((file) => ({
      file: file,
      preview: URL.createObjectURL(file), 
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá dịch vụ.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      const uploadedImages = [];

      // --- BẮT ĐẦU VÒNG LẶP UPLOAD THEO CHUẨN ĐỊNH DẠNG CỦA BẠN ---
      if (images.length > 0) {
        setUploading(true);

        for (let i = 0; i < images.length; i++) {
          const imgItem = images[i];
          if (!imgItem || !imgItem.file) continue;

          const formData = new FormData();
          formData.append("files", imgItem.file); // Đính kèm file thô
          formData.append(
            "metadata",
            JSON.stringify([
              { type: "REVIEW_IMAGE", title: `Review Image ${i + 1}` }, // Thay đổi type cho đúng ngữ cảnh Đánh giá
            ]),
          );

          const uploadRes = await axios.post(
            "/api/owner-applications/upload",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );

          // Nếu upload file đơn lẻ thành công, bốc tách URL lưu vào mảng đích
          if (uploadRes.data.success && uploadRes.data.data.length > 0) {
            const uploadedUrl = uploadRes.data.data[0].url;
            uploadedImages.push(uploadedUrl);
          }
        }
        setUploading(false);
      }
      // --- KẾT THÚC VÒNG LẶP UPLOAD ---

      // Gửi payload cuối cùng chứa mảng URL ảnh sạch lên API Review
      const response = await axios.post(
        "/api/reviews",
        {
          bookingId: booking._id,
          rating,
          comment,
          isAnonymous,
          images: uploadedImages, // Mảng chuỗi các URL đã upload thành công lên hệ thống
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        // Giải phóng tất cả URL preview sau khi hoàn tất để bảo toàn bộ nhớ trình duyệt
        images.forEach((img) => URL.revokeObjectURL(img.preview));

        if (onSuccess) onSuccess(booking._id);
        onClose();
      }
    } catch (err) {
      console.error("Review Submit Error:", err);
      setError(
        err.response?.data?.message ||
          "Gửi đánh giá hoặc tải ảnh thất bại, vui lòng thử lại.",
      );
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Lớp nền mờ (Overlay) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Khung Hộp Thoại (Modal Card) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border border-teal-50 w-full max-w-lg rounded-tr-[2.5rem] rounded-bl-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-6 flex flex-col max-h-[90vh]"
        >
          {/* Tiêu đề */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-xl font-bold text-[#004D40] font-cormorant">
                Đánh giá dịch vụ
              </h3>
              <p className="text-[11px] text-gray-400 font-medium truncate max-w-xs mt-0.5">
                Dịch vụ: {booking.serviceId?.name || "Đang cập nhật"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 mt-4 overflow-y-auto pr-1 scrollbar-thin flex-1"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600 font-semibold animate-shake">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 🌟 1. ĐIỂM SỐ TỔNG HỢP (STARS) */}
            <div className="text-center bg-teal-50/30 p-4 rounded-2xl border border-teal-50">
              <label className="block text-xs font-black text-[#004D40] uppercase tracking-wider mb-2">
                Trải nghiệm của bạn thế nào?
              </label>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    type="button"
                    key={star}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      size={28}
                      className={`${
                        star <= (hoverRating || rating)
                          ? "text-[#FFAB40] fill-[#FFAB40]"
                          : "text-gray-200"
                      } transition-all duration-150`}
                    />
                  </motion.button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-[11px] font-bold text-[#FFAB40] uppercase tracking-wider mt-1.5">
                  {rating === 5
                    ? "Rất tuyệt vời 😍"
                    : rating === 4
                      ? "Hài lòng 😊"
                      : rating === 3
                        ? "Bình thường 😐"
                        : rating === 2
                          ? "Tệ 😞"
                          : "Quá tệ 😡"}
                </p>
              )}
            </div>

            {/* 📝 2. NỘI DUNG ĐÁNH GIÁ (COMMENT) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-[#004D40] uppercase tracking-wider">
                  Nội dung bình luận
                </label>
                <span
                  className={`text-[10px] font-bold ${comment.length > 500 ? "text-red-500" : "text-gray-400"}`}
                >
                  {comment.length}/500 ký tự
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Chia sẻ trải nghiệm thực tế của bạn về chất lượng dịch vụ, thái độ phục vụ tại đây nhé (tối thiểu 10 ký tự)..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] transition-all resize-none placeholder:text-gray-300 leading-relaxed"
              />
            </div>

            {/* 📸 3. TẢI LÊN HÌNH ẢNH */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#004D40] uppercase tracking-wider block px-1">
                Hình ảnh thực tế (Tối đa 5 ảnh)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {/* Các ảnh đã chọn */}
                {/* Các ảnh đã chọn hiển thị preview */}
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="aspect-square relative rounded-xl overflow-hidden border border-gray-100 group shadow-sm"
                  >
                    <img
                      src={img.preview}
                      alt="review-thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Ô chọn ảnh bổ sung */}
                {images.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#004D40] bg-gray-50/50 hover:bg-teal-50/20 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-gray-400 hover:text-[#004D40]">
                    {uploading ? (
                      <Loader2
                        size={16}
                        className="animate-spin text-[#004D40]"
                      />
                    ) : (
                      <>
                        <Camera size={16} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                          Thêm ảnh
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 👁️ 4. TÙY CHỌN ẨN DANH */}
            <div className="flex items-center px-1 py-1 select-none">
              <label className="flex items-center gap-2 cursor-pointer group text-xs text-gray-500 font-medium">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-[#004D40] focus:ring-[#004D40] border-gray-300 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Ẩn danh khi hiển thị đánh giá</span>
              </label>
            </div>

            {/* NÚT THỰC THI (ACTIONS) */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || uploading }
                className="flex-1 py-2.5 rounded-xl bg-[#004D40] text-[#FFAB40] text-xs font-bold hover:bg-[#002D25] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Gửi đánh giá
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;