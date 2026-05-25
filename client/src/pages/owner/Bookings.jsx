import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  Layers,
  ChevronDown,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import Pagination from "../common/Pagination";
import EmptyState from "../common/Empty";
import BookingDetailModal from "./BookingDetailModal";
import FeedbackModal from "../../components//FeedbackModal";

const SERVICE_TYPES = [
  { code: "HOTEL", label: "Khách sạn / Lưu trú" },
  { code: "RESTAURANT", label: "Nhà hàng / Ẩm thực" },
  { code: "ACTIVITY", label: "Tour & Hoạt động" },
];

const Bookings = () => {
  const { getToken } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [allOwnerServices, setAllOwnerServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedServiceId, setSelectedServiceId] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${month}`;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [selectedBooking, setSelectedBooking] = useState(null);

  const systemSynchronization = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [bookingsRes, servicesRes] = await Promise.all([
        axios.get("/api/bookings/service-bookings", config),
        axios.get("/api/services/my", config),
      ]);

      if (bookingsRes.data?.success) {
        const rawBookings = bookingsRes.data.data.bookings || [];
        // Lọc bỏ đơn PENDING và EXPIRED khỏi danh sách quản lý thương mại
        const validBookings = rawBookings.filter(
          (b) => b.status !== "PENDING" && b.status !== "EXPIRED",
        );
        setBookings(validBookings);
      }
      if (servicesRes.data?.success) {
        const AllServices = servicesRes.data.data || [];
        setAllOwnerServices(
          Array.isArray(AllServices) ? AllServices : AllServices.services || [],
        );
      }
    } catch (error) {
      console.error("Lỗi đồng bộ hệ thống dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    systemSynchronization();
  }, [systemSynchronization]);

  const handleConfirmRefund = (bookingId, refundAmount) => {
    setModalConfig({
      isOpen: true,
      type: "confirm",
      title: "Xác nhận hoàn tiền",
      message: `Bạn có chắc chắn đã chuyển khoản hoàn lại số tiền ${Number(refundAmount).toLocaleString("vi-VN")} đ cho khách hàng? Hành động này sẽ thay đổi trạng thái đơn hàng và không thể hoàn tác.`,
      onConfirm: async () => {
        setModalConfig({
          isOpen: true,
          type: "loading",
          title: "Đang xử lý...",
          message: "Hệ thống đang cập nhật trạng thái đơn đặt chỗ. Vui lòng giữ kết nối internet.",
        });

        try {
          const token = await getToken();
          const config = { headers: { Authorization: `Bearer ${token}` } };

          const response = await axios.patch(
            `/api/bookings/confirm-owner-refund/${bookingId}`,
            { refundAmount: Number(refundAmount) },
            config,
          );

          if (response.data?.success) {
            if (setSelectedBooking) setSelectedBooking(null);
            systemSynchronization(); 
            setModalConfig({
              isOpen: true,
              type: "success",
              title: "Thành công",
              message: "Xác nhận đối tác đã chuyển khoản hoàn tiền thành công!",
              onConfirm: () => {
                setModalConfig((prev) => ({ ...prev, isOpen: false }));
              },
            });
          }
        } catch (error) {
          console.error("Lỗi khi xác nhận hoàn tiền:", error);
          setModalConfig({
            isOpen: true,
            type: "error",
            title: "Lỗi hoàn tiền",
            message: error.response?.data?.message || "Không thể thực hiện xác nhận hoàn tiền.",
            onConfirm: () => {
              setModalConfig((prev) => ({ ...prev, isOpen: false }));
            },
          });
        }
      },
    });
  };

  const filteredServicesDropdown = useMemo(() => {
    if (selectedType === "ALL") return allOwnerServices;
    return allOwnerServices.filter((s) => s.type === selectedType);
  }, [allOwnerServices, selectedType]);

  useEffect(() => {
    setSelectedServiceId("ALL");
    setCurrentPage(1);
  }, [selectedType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedServiceId, searchTerm, selectedMonth]);

  const getTableUnitLabel = (type) => {
    if (type === "HOTEL") return "phòng";
    if (type === "RESTAURANT") return "suất";
    return "vé";
  };

  const processedBookings = useMemo(() => {
    return bookings.filter((b) => {
      let matchStatus = true;
      if (statusFilter !== "ALL") {
        matchStatus = b.status === statusFilter;
      }

      const matchType =
        selectedType === "ALL" || b.serviceId?.type === selectedType;
      const matchService =
        selectedServiceId === "ALL" || b.serviceId?._id === selectedServiceId;

      const cleanText = searchTerm.toLowerCase().trim();
      const matchSearch =
        cleanText === "" ||
        (b.bookingCode || "").toLowerCase().includes(cleanText) ||
        (b.bookingDetails?.customerInfo?.fullName || "")
          .toLowerCase()
          .includes(cleanText);

      return matchStatus && matchType && matchService && matchSearch;
    });
  }, [bookings, statusFilter, selectedType, selectedServiceId, searchTerm]);

  // --- TÍNH THỐNG KÊ DOANH THU ---
  const dynamicStats = useMemo(() => {
    const contextData = bookings.filter((b) => {
      const matchType =
        selectedType === "ALL" || b.serviceId?.type === selectedType;
      const matchService =
        selectedServiceId === "ALL" || b.serviceId?._id === selectedServiceId;
      return matchType && matchService;
    });

    const paidCount = contextData.filter((b) => b.status === "PAID").length;
    const pendingCancelCount = contextData.filter(
      (b) => b.status === "CANCELLATION_PENDING",
    ).length;
    const completedCount = contextData.filter(
      (b) => b.status === "COMPLETED",
    ).length;
    const cancelledCount = contextData.filter(
      (b) => b.status === "CANCELLED",
    ).length;

    // Lọc các đơn có ngày check-in thuộc tháng/chu kỳ đang chọn
    const revenueDataInMonth = contextData.filter((b) => {
      if (!b.bookingDetails?.checkInDate) return false;
      const checkInStr = b.bookingDetails.checkInDate.substring(0, 7);
      return checkInStr === selectedMonth;
    });

    // Thực hiện tính toán doanh thu thực tế thu về túi Owner
    const revenueSum = revenueDataInMonth.reduce((sum, b) => {
      // 1. Nếu đơn hàng đã HOÀN THÀNH -> Cộng 100% giá trị đơn hàng
      if (b.status === "COMPLETED") {
        return sum + (b.bookingDetails?.totalPrice || 0);
      }

      // 2. Nếu đơn hàng đã HỦY -> Chỉ cộng số tiền phạt giữ lại được cấu hình cấu trúc cho Owner (penaltyAmount)
      if (b.status === "CANCELLED") {
        const retainedOwnerAmount = b.cancellationDetails?.penaltyAmount || 0;
        return sum + retainedOwnerAmount;
      }

      // Các trạng thái khác (CANCELLATION_PENDING, v.v.) tạm thời chưa ghi nhận dòng tiền thực tế
      return sum;
    }, 0);

    return {
      PAID: paidCount,
      CANCELLATION_PENDING: pendingCancelCount,
      COMPLETED: completedCount,
      CANCELLED: cancelledCount,
      REVENUE: revenueSum,
    };
  }, [bookings, selectedType, selectedServiceId, selectedMonth]);

  const statusConfig = {
    PAID: {
      text: "Đang sử dụng",
      className: "bg-teal-50 text-teal-700 border-teal-200",
    },
    COMPLETED: {
      text: "Đã hoàn thành",
      className: "bg-emerald-50 text-[#004D40] border-emerald-200",
    },
    CANCELLATION_PENDING: {
      text: "Đang chờ hủy",
      className: "bg-amber-50 text-amber-600 border-amber-200",
    },
    CANCELLED: {
      text: "Đã hủy",
      className: "bg-red-50 text-red-600 border-red-100",
    },
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedBookings.slice(startIndex, startIndex + pageSize);
  }, [processedBookings, currentPage]);

  const totalPages = Math.ceil(processedBookings.length / pageSize);
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  return (
    <div className="space-y-8 font-jakarta pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-cormorant font-bold text-[#004D40]">
          Hệ thống quản lý đơn đặt chỗ
        </h1>
      </div>

      {/* 🌲 1. CÂY DỊCH VỤ DROPDOWN */}
      <div className="p-5 bg-white/80 backdrop-blur-md border border-[#004D40]/10 rounded-tr-[28px] rounded-bl-[28px] rounded-tl-xl rounded-br-xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-white border border-[#E0F2F1] rounded-xl text-xs font-bold text-[#004D40] outline-none cursor-pointer"
            >
              <option value="ALL">📍 Tất cả loại hình dịch vụ</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  ❖ {t.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#004D40]/40 pointer-events-none"
              size={16}
            />
          </div>
          <div className="relative">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-white border border-[#E0F2F1] rounded-xl text-xs font-bold text-[#004D40] outline-none cursor-pointer"
            >
              <option value="ALL">
                🔍 Chọn sản phẩm cụ thể ({filteredServicesDropdown.length} dịch
                vụ sở hữu)
              </option>
              {filteredServicesDropdown.map((s) => (
                <option key={s._id} value={s._id}>
                  ⤷ {s.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#004D40]/40 pointer-events-none"
              size={16}
            />
          </div>
        </div>
      </div>

      {/* 📊 2. THÈ THỐNG KÊ NHANH (Mỗi thẻ mang một bản sắc màu riêng biệt theo yêu cầu) */}
      <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
        {/* Thẻ Đang Sử Dụng (Màu Xanh Teal Đặc Trưng) */}
        <div className="bg-gradient-to-br from-white to-teal-50/30 p-5 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-lg rounded-br-lg border border-teal-600/20 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase">
              Đang chờ xử lý
            </span>
            <Clock size={16} className="text-orange-400" />
          </div>
          <p className="text-3xl font-black italic text-orange-400 mt-3">
            {dynamicStats.CANCELLATION_PENDING}{" "}
            <span className="text-xs font-bold text-orange-400 not-italic">
              đơn
            </span>
          </p>
        </div>

        {/* Thẻ Đã Hoàn Thành (Màu Xanh Lá Đậm - Chủ Đạo) */}
        <div className="bg-gradient-to-br from-white to-[#004D40]/5 p-5 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-lg rounded-br-lg border border-[#004D40]/20 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black tracking-widest text-[#004D40] uppercase">
              Đã hoàn thành
            </span>
            <CheckCircle2 size={16} className="text-[#004D40]" />
          </div>
          <p className="text-3xl font-black italic text-[#004D40] mt-3">
            {dynamicStats.COMPLETED}{" "}
            <span className="text-xs font-bold text-gray-400 not-italic">
              đơn
            </span>
          </p>
        </div>

        {/* Thẻ Đã Hủy Đơn (Màu Đỏ Nhạt) */}
        <div className="bg-gradient-to-br from-white to-red-50/40 p-5 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-lg rounded-br-lg border border-red-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black tracking-widest text-red-700 uppercase">
              Đã hủy đơn
            </span>
            <XCircle size={16} className="text-red-600" />
          </div>
          <p className="text-3xl font-black italic text-red-600 mt-3">
            {dynamicStats.CANCELLED}{" "}
            <span className="text-xs font-bold text-gray-400 not-italic">
              đơn
            </span>
          </p>
        </div>

        {/* Thẻ Doanh Thu Theo Tháng Chọn Sẵn */}
        <div className="bg-gradient-to-br from-[#004D40] to-[#002821] p-5 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-lg rounded-br-lg text-white shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black tracking-widest text-white/70 uppercase">
              Doanh thu chu kỳ
            </span>
            {/* Bộ chọn tháng trực tiếp trên Card */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-[10px] text-[#FFAB40] font-black outline-none cursor-pointer"
            />
          </div>
          <p className="text-[10px] text-white/70 mt-2">
            Bao gồm các đơn đã hoàn thành và đơn hủy đã được hoàn tiền
          </p>
          <p className="text-base font-black text-[#FFAB40] mt-2 truncate">
            {formatCurrency(dynamicStats.REVENUE)} đ
          </p>
        </div>
      </div>

      {/* 🛠️ 3. TOOLBAR HÀNG ĐẦU MÀN HÌNH BẢNG */}
      <div className="bg-white/80 backdrop-blur-md p-5 border border-[#004D40]/10 rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Nút lọc trạng thái thực tế */}
          <div className="flex items-center bg-[#E0F2F1]/50 p-1 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md overflow-x-auto max-w-full">
            {[
              { key: "ALL", label: "Tất cả đơn thực" },
              { key: "PAID", label: "Đang sử dụng" },
              { key: "COMPLETED", label: "Đã hoàn thành" },
              { key: "CANCELLATION_PENDING", label: "Chờ hoàn tiền" },
              { key: "CANCELLED", label: "Đã hủy đơn" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`px-4 py-2 rounded-tr-lg rounded-bl-lg rounded-tl-sm rounded-br-sm text-xs font-bold whitespace-nowrap transition-all ${statusFilter === item.key ? "bg-[#004D40] text-white shadow" : "text-[#004D40]/60 hover:text-[#004D40]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm thông tin tài khoản */}
          <div className="relative w-full lg:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/40"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-white border border-[#E0F2F1] rounded-xl text-xs font-bold text-[#004D40] outline-none focus:ring-2 focus:ring-[#004D40]/20 placeholder-[#004D40]/40"
            />
          </div>
        </div>

        {/* 📋 BẢNG DANH SÁCH ĐƠN ĐẶC CHỖ */}
        <div className="overflow-x-auto border-t border-gray-100 pt-2">
          {processedBookings.length === 0 ? (
            <EmptyState
              title="Không tìm thấy đơn hàng"
              description="Không có đơn đặt chỗ nào khớp với tổ hợp bộ lọc hiện hành của bạn."
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#004D40]/5 text-[#004D40] text-[11px] uppercase tracking-widest border-b border-[#004D40]/10">
                  <th className="px-6 py-4 font-black">Mã & Khách hàng</th>
                  <th className="px-6 py-4 font-black">Dịch vụ cung cấp</th>
                  <th className="px-6 py-4 font-black">Quy mô đặt chỗ</th>
                  <th className="px-6 py-4 font-black text-center">
                    Trạng thái xử lý
                  </th>
                  <th className="px-6 py-4 font-black text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#004D40]/5 text-xs font-semibold">
                {paginatedData.map((booking) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-[#E0F2F1]/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#FFAB40]">
                          {booking.bookingCode}
                        </span>
                        <span className="font-bold text-[#004D40] text-sm mt-0.5">
                          {booking.bookingDetails?.customerInfo?.fullName ||
                            "Khách hệ thống"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[#004D40] font-bold max-w-xs truncate">
                          {booking.serviceId?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex flex-col">
                        <span>
                          {booking.bookingDetails?.quantity}{" "}
                          {getTableUnitLabel(booking.serviceId?.type)}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          {booking.bookingDetails?.checkInDate
                            ? new Date(
                                booking.bookingDetails.checkInDate,
                              ).toLocaleDateString("vi-VN")
                            : "N/A"}{" "}
                          ➡️{" "}
                          {booking.bookingDetails?.checkOutDate
                            ? new Date(
                                booking.bookingDetails.checkOutDate,
                              ).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig[booking.status]?.className || statusConfig.CANCELLED.className}`}
                      >
                        {statusConfig[booking.status]?.text || "Đã hủy"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#004D40] bg-[#E0F2F1] rounded-lg hover:bg-[#004D40] hover:text-white transition-all"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PHÂN TRANG */}
      {processedBookings.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={processedBookings.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      )}

      {/* MODAL CHI TIẾT */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailModal
            isOpen={Boolean(selectedBooking)}
            onClose={() => setSelectedBooking(null)}
            booking={selectedBooking}
            handleConfirmRefund={handleConfirmRefund}
          />
        )}
      </AnimatePresence>

      {/* MODAL PHẢN HỒI */}
      <FeedbackModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() =>
          setModalConfig((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onConfirm={modalConfig.onConfirm}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </div>
  );
};

export default Bookings;