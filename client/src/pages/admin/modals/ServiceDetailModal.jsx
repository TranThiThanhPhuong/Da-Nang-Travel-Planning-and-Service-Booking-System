import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  MapIcon,
} from "lucide-react";

const ServiceDetailModal = ({
  application,
  onClose,
  onApprove,
  onReject,
  onImageClick,
  getStatusBadge,
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  if (!application) return null;

  const getTypeLabel = (type) => {
    switch (type) {
      case "HOTEL": return "Lưu trú";
      case "RESTAURANT": return "Ẩm thực";
      case "ACTIVITY": return "Trải nghiệm";
      case "CAR_RENTAL": return "Thuê xe";
      default: return type;
    }
  };

  const getPriceLabel = (type) => {
    switch (type) {
      case "HOTEL": return "/phòng";
      case "RESTAURANT": return "/người";
      case "ACTIVITY": return "/khách";
      case "CAR_RENTAL": return "/ngày";
      default: return "";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  // Trích xuất dữ liệu an toàn (Safe Extraction)
  const ownerName = application.ownerId?.fullName || "Chưa rõ";
  const ownerEmail = application.ownerId?.email || "Chưa cập nhật";
  const avatarLetter = ownerName.charAt(0).toUpperCase() || "U";

  // Tọa độ GeoJSON: [Longitude, Latitude]
  const lng = application.location?.coordinates?.[0] || 0;
  const lat = application.location?.coordinates?.[1] || 0;

  // Xử lý hình ảnh (Nếu không có images thì lấy thumbnail)
  const displayImages = application.images?.length > 0 ? application.images : (application.thumbnail ? [application.thumbnail] : []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#F5F5F5] w-full max-w-6xl rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="bg-white/90 backdrop-blur-[10px] p-6 border-b border-[#E0F2F1] flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-cormorant font-bold text-[#004D40]">
              Chi tiết dịch vụ
            </h2>
            <p className="text-sm text-[#004D40]/60 mt-1">
              ID: <span className="font-bold">#{application._id}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#004D40]/5 rounded-full transition-colors">
            <X className="text-[#004D40]" size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI - Thông tin chính */}
          <div className="lg:col-span-7 space-y-6">
            {/* Thông tin chung */}
            <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <h3 className="text-xl font-cormorant font-bold text-[#004D40] border-b border-[#004D40]/10 pb-3 mb-5">
                Thông tin chung
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">Tên dịch vụ</label>
                  <p className="text-base font-bold text-[#004D40]">{application.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">Loại hình</label>
                    <p className="text-sm font-bold text-[#004D40]">{getTypeLabel(application.type)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">Giá dịch vụ</label>
                    <p className="text-base font-black text-[#FFAB40]">
                      {formatPrice(application.pricePerUnit)}
                      <span className="text-xs font-medium text-[#004D40]/60 ml-1">{getPriceLabel(application.type)}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">Mô tả chi tiết</label>
                  <p className="text-sm text-[#004D40]/80 leading-relaxed whitespace-pre-wrap">
                    {application.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Vị trí & Bản đồ */}
            <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <h3 className="text-xl font-cormorant font-bold text-[#004D40] border-b border-[#004D40]/10 pb-3 mb-5">
                Vị trí trên bản đồ
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">Địa chỉ cụ thể</label>
                  <div className="flex items-start gap-2 text-sm text-[#004D40]">
                    <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="font-medium">{application.address}</p>
                  </div>
                </div>

                {/* MOCKUP BẢN ĐỒ */}
                <div className="w-full h-64 bg-[#E0F2F1]/30 border-2 border-[#004D40]/20 border-dashed rounded-tr-[24px] rounded-bl-[24px] rounded-tl-xl rounded-br-xl flex flex-col items-center justify-center">
                  <MapIcon size={40} className="text-[#004D40]/30 mb-2" />
                  <p className="text-sm text-[#004D40] font-bold">Khu vực hiển thị Bản đồ</p>
                  <p className="text-xs text-[#004D40]/60 font-medium mt-1">Lat: {lat} | Lng: {lng}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">Kinh độ (Longitude)</label>
                    <p className="text-sm font-medium text-[#004D40] bg-black/5 px-3 py-2 rounded-md border border-[#E0F2F1]">
                      {lng}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">Vĩ độ (Latitude)</label>
                    <p className="text-sm font-medium text-[#004D40] bg-black/5 px-3 py-2 rounded-md border border-[#E0F2F1]">
                      {lat}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin đối tác */}
            <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <h3 className="text-xl font-cormorant font-bold text-[#004D40] border-b border-[#004D40]/10 pb-3 mb-5">
                Thông tin đối tác
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#004D40] flex items-center justify-center font-bold text-white text-lg">
                  {avatarLetter}
                </div>
                <div>
                  <p className="font-bold text-[#004D40]">{ownerName}</p>
                  <p className="text-xs text-[#004D40]/60">Chủ sở hữu</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-[#004D40]/80">
                  <Mail size={16} className="text-[#004D40]/60" />
                  <span>{ownerEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI - Album & Tiện ích */}
          <div className="lg:col-span-5 space-y-6">
            {/* Album Hình ảnh */}
            <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <div className="flex justify-between items-center border-b border-[#004D40]/10 pb-3 mb-5">
                <h3 className="text-xl font-cormorant font-bold text-[#004D40]">Album Hình ảnh</h3>
                <span className="text-xs font-bold bg-[#E0F2F1] text-[#004D40] px-3 py-1 rounded-full">
                  {displayImages.length} ảnh
                </span>
              </div>

              {displayImages.length > 0 ? (
                <>
                  <div className="aspect-square rounded-tr-[24px] rounded-bl-[24px] rounded-tl-xl rounded-br-xl overflow-hidden mb-4 border-2 border-[#E0F2F1] cursor-pointer bg-gray-100">
                    <img
                      src={displayImages[activeImgIndex]}
                      className="w-full h-full object-cover"
                      alt=""
                      onClick={() => onImageClick({ url: displayImages[activeImgIndex], title: application.name })}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {displayImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImgIndex(idx)}
                        className={`aspect-square rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md overflow-hidden border-2 transition-all ${activeImgIndex === idx ? "border-[#004D40] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm font-bold">
                  Không có hình ảnh
                </div>
              )}
            </div>

            {/* Tiện ích */}
            <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <h3 className="text-xl font-cormorant font-bold text-[#004D40] border-b border-[#004D40]/10 pb-3 mb-5">
                Tiện ích cung cấp
              </h3>
              {application.features && application.features.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {application.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-medium text-[#004D40]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFAB40]" />
                      {feature}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#004D40]/60 italic">Chưa có thông tin tiện ích</p>
              )}
            </div>

            {/* Trạng thái */}
            <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <h3 className="text-xl font-cormorant font-bold text-[#004D40] border-b border-[#004D40]/10 pb-3 mb-5">
                Trạng thái duyệt
              </h3>
              <div className={`p-4 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md border-2 ${getStatusBadge(application.approvalStatus).bg} ${getStatusBadge(application.approvalStatus).border}`}>
                <p className={`text-center font-bold ${getStatusBadge(application.approvalStatus).text}`}>
                  {getStatusBadge(application.approvalStatus).label}
                </p>
              </div>

              {/* Nếu bị từ chối thì hiển thị lý do */}
              {application.approvalStatus === "REJECTED" && application.adminNotes && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 mb-1">Lý do từ chối:</p>
                  <p className="text-sm text-red-700">{application.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        {application.approvalStatus === "PENDING" && (
          <div className="bg-white/90 backdrop-blur-[10px] p-6 border-t border-[#E0F2F1] flex gap-4">
            <button
              onClick={onApprove}
              className="flex-1 bg-[#00C853] hover:bg-[#00B248] text-white font-bold py-3 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> PHÊ DUYỆT
            </button>
            <button
              onClick={onReject}
              className="flex-1 bg-[#FF5252]/10 hover:bg-[#FF5252] text-[#FF5252] hover:text-white font-bold py-3 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md transition-all border-2 border-[#FF5252]/30 flex items-center justify-center gap-2"
            >
              <XCircle size={20} /> TỪ CHỐI
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ServiceDetailModal;