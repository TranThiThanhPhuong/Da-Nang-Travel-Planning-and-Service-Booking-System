import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  User,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import EmptyState from "../common/Empty";
import Pagination from "../common/Pagination";
import ConfirmModal from "../common/ConfirmModal";
import RejectModal from "../common/RejectModal";
import ImageZoomModal from "../common/ImageZoomModal";
import ServiceDetailModal from "./modals/ServiceDetailModal";
import FeedbackModal from "../common/FeedbackModal";
const Services = () => {
  const { getToken } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [selected, setSelected] = useState(null);
  const [zoomImg, setZoomImg] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReject, setShowReject] = useState(false);

  // State quản lý Feedback Modal
  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  const [page, setPage] = useState(1);
  const pageSize = 6;

  // 1. Fetch dữ liệu từ API
  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/services/admin/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(res.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách dịch vụ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [getToken]);

  // 2. FILTER LOGIC
  const filtered = useMemo(() => {
    if (!search.trim() && statusFilter === "ALL" && typeFilter === "ALL") return services;
    const keyword = search.toLowerCase().trim();

    return services.filter((service) => {
      const matchSearch =
        service.name?.toLowerCase().includes(keyword) ||
        service.address?.toLowerCase().includes(keyword) ||
        service.ownerId?.fullName?.toLowerCase().includes(keyword) ||
        service.ownerId?.email?.toLowerCase().includes(keyword);

      const matchStatus = statusFilter === "ALL" || service.approvalStatus === statusFilter;
      const matchType = typeFilter === "ALL" || service.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, typeFilter, services]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return { bg: "bg-[#FFAB40]/10", text: "text-[#FFAB40]", border: "border-[#FFAB40]/30", label: "Chờ duyệt" };
      case "APPROVED":
        return { bg: "bg-[#00C853]/10", text: "text-[#00C853]", border: "border-[#00C853]/30", label: "Đã duyệt" };
      case "REJECTED":
        return { bg: "bg-[#FF5252]/10", text: "text-[#FF5252]", border: "border-[#FF5252]/30", label: "Đã từ chối" };
      case "HIDDEN":
        return { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-500/30", label: "Đang ẩn" };
      default:
        return {};
    }
  };

  // 3. XỬ LÝ PHÊ DUYỆT (Gọi API)
  const handleApprove = async () => {
    setShowConfirm(false);
    setFeedback({ isOpen: true, type: "loading", title: "Đang xử lý", message: "Hệ thống đang phê duyệt dịch vụ..." });

    try {
      const token = await getToken();
      await axios.patch(`/api/services/admin/${selected._id}/review`,
        { status: "APPROVED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback({ isOpen: true, type: "success", title: "Thành công", message: "Dịch vụ đã được phê duyệt và hiển thị công khai." });
      fetchServices();
    } catch (error) {
      setFeedback({ isOpen: true, type: "error", title: "Thất bại", message: error.response?.data?.message || "Đã xảy ra lỗi khi phê duyệt." });
    } finally {
      setSelected(null);
    }
  };

  // 4. XỬ LÝ TỪ CHỐI (Gọi API)
  const handleReject = async (reason) => {
    if (!reason.trim()) {
      setFeedback({ isOpen: true, type: "warning", title: "Thiếu thông tin", message: "Vui lòng nhập lý do từ chối để đối tác chỉnh sửa." });
      return;
    }

    setShowReject(false);
    setFeedback({ isOpen: true, type: "loading", title: "Đang xử lý", message: "Hệ thống đang lưu lý do từ chối..." });

    try {
      const token = await getToken();
      await axios.patch(`/api/services/admin/${selected._id}/review`,
        { status: "REJECTED", adminNotes: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback({ isOpen: true, type: "success", title: "Đã từ chối", message: "Hồ sơ đã bị từ chối. Thông báo đã được gửi đến đối tác." });
      fetchServices();
    } catch (error) {
      setFeedback({ isOpen: true, type: "error", title: "Thất bại", message: error.response?.data?.message || "Đã xảy ra lỗi khi từ chối." });
    } finally {
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004D40]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 font-jakarta">

      {/* BỘ LỌC */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden"
      >
        <div className="p-5 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/40" size={20} />
            <input
              type="text"
              placeholder="Tìm theo tên dịch vụ, chủ sở hữu, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-bold text-[#004D40] placeholder-[#004D40]/40"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004D40]/20 font-bold text-[#004D40] cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="HIDDEN">Đang ẩn</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004D40]/20 font-bold text-[#004D40] cursor-pointer"
            >
              <option value="ALL">Tất cả loại hình</option>
              <option value="HOTEL">Lưu trú</option>
              <option value="RESTAURANT">Ẩm thực</option>
              <option value="ACTIVITY">Trải nghiệm</option>
            </select>
          </div>
        </div>

        <div className="px-5 pb-4">
          <p className="text-sm text-[#004D40]/60 font-medium">
            Tìm thấy <span className="text-[#004D40] font-bold">{filtered.length}</span> dịch vụ
          </p>
        </div>
      </motion.div>

      {/* SERVICE GRID */}
      {paginatedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedData.map((service, idx) => {
            const statusBadge = getStatusBadge(service.approvalStatus);
            return (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}
                className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 group hover:shadow-[0_12px_40px_rgb(0,77,64,0.08)] transition-all flex flex-col"
              >
                <div className="relative h-48 overflow-hidden shrink-0">
                  <img
                    src={service.thumbnail || service.images?.[0]}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-[#004D40] text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                    {getTypeLabel(service.type)}
                  </span>
                  <span className={`absolute top-3 right-3 text-[10px] px-3 py-1.5 rounded-full font-bold border backdrop-blur-md ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#004D40] line-clamp-1 mb-1" title={service.name}>
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#004D40]/60 flex items-start gap-1 line-clamp-2">
                      <MapPin size={12} className="mt-0.5 shrink-0" /> {service.address}
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-y border-[#E0F2F1]">
                    <div>
                      <p className="text-[10px] text-[#004D40]/60 uppercase font-bold tracking-widest mb-0.5">Giá dịch vụ</p>
                      <p className="text-sm font-black text-[#FFAB40]">
                        {formatPrice(service.pricePerUnit)}
                        <span className="text-xs font-medium text-[#004D40]/60">{getPriceLabel(service.type)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[#004D40]/60" title={service.ownerId?.email}>
                      <User size={14} />
                      <span className="text-xs font-medium max-w-[100px] truncate">
                        {service.ownerId?.fullName || "Chưa rõ"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelected(service)}
                    className="w-full bg-[#004D40]/5 hover:bg-[#004D40] text-[#004D40] hover:text-white px-4 py-2.5 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Xem chi tiết
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <EmptyState title="Không tìm thấy dịch vụ" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" />
      )}

      {/* PHÂN TRANG */}
      {paginatedData.length > 0 && (
        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      )}

      {/* MODALS */}
      {selected && !showConfirm && !showReject && (
        <ServiceDetailModal
          application={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setShowConfirm(true)}
          onReject={() => setShowReject(true)}
          onImageClick={setZoomImg}
          getStatusBadge={getStatusBadge}
        />
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleApprove}
        title="Xác nhận phê duyệt?"
        message="Dịch vụ này sẽ được hiển thị công khai trên website sau khi bạn xác nhận."
      />

      <RejectModal
        isOpen={showReject}
        onClose={() => setShowReject(false)}
        onReject={handleReject}
        placeholder="VD: Hình ảnh không rõ nét, sai địa chỉ, vi phạm chính sách..."
      />

      <ImageZoomModal image={zoomImg} onClose={() => setZoomImg(null)} />

      {/* FEEDBACK MODAL (Nằm cao nhất) */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
};

export default Services;