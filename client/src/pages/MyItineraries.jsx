import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Trash2,
  Eye,
  Loader2,
  Plus,
  Compass,
  Check,
  CheckCircle,
  Play
} from "lucide-react";

const MyItineraries = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, DRAFT, CONFIRMED, ONGOING, COMPLETED
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, [filter]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const url = filter === "ALL" ? '/api/trips' : `/api/trips?status=${filter}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setTrips(response.data.data);
      }
    } catch (error) {
      console.error("Fetch trips error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (tripId, currentStatus) => {
    let confirmMessage = "";
    if (currentStatus === "DRAFT") confirmMessage = "Xác nhận chốt và lưu chính thức lịch trình này?";
    if (currentStatus === "CONFIRMED") confirmMessage = "Xác nhận bắt đầu khởi hành chuyến đi này?";
    if (currentStatus === "ONGOING") confirmMessage = "Xác nhận bạn đã hoàn thành chuyến hành trình này?";

    if (!confirm(confirmMessage)) return;

    setUpdating(tripId);
    try {
      const token = await getToken();
      const response = await axios.put(
        `/api/trips/${tripId}/advance-status`,
        {}, // Không cần truyền body, BE sẽ tự xử lý nhảy cấp trạng thái tuyến tính
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        fetchTrips();
      }
    } catch (error) {
      console.error("Advance status error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi chuyển trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (tripId) => {
    if (!confirm("Bạn có chắc muốn xóa lịch trình này?")) return;
    try {
      const token = await getToken();
      const response = await axios.delete(`/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        alert("✅ Đã xóa lịch trình");
        fetchTrips();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleConfirmTrip = async (tripId) => {
    if (!confirm("Xác nhận khởi hành chuyến đi này?")) return;
    setUpdating(tripId);
    try {
      const token = await getToken();
      const response = await axios.put(
        `/api/trips/`,
        { status: "ONGOING" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("✅ Chuyến đi đã khởi hành!");
        fetchTrips();
      }
    } catch (error) {
      console.error("Confirm trip error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setUpdating(null);
    }
  };

  const handleCompleteTrip = async (tripId) => {
    if (!confirm("Xác nhận chuyến đi này đã hoàn thành?")) return;

    setUpdating(tripId);
    try {
      const token = await getToken();
      const response = await axios.put(
        `/api/trips/`,
        { status: "COMPLETED" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("✅ Chuyến đi đã hoàn thành!");
        fetchTrips();
      }
    } catch (error) {
      console.error("Complete trip error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount);

  // Cấu hình hiệu ứng Spring động theo Design System
  const springTransition = { type: "spring", stiffness: 300, damping: 20 };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-20 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Grainy Texture Simulation Layer */}
        <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />
        <Loader2 className="animate-spin text-[#004D40] opacity-80" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F7F3] via-[#F5F5F5] to-white pt-28 pb-20 px-4 md:px-8 font-jakarta relative overflow-hidden">
      {/* Texture background overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.012] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2 border-b border-[#E0F2F1]/60 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-cormorant font-bold text-[#004D40] tracking-tight mb-2">
              Lịch trình của tôi
            </h1>
            <p className="text-xs uppercase tracking-[3px] font-bold text-gray-400">
              Chữa lành và khám phá cùng D-Pulse AI
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={springTransition}
            onClick={() => navigate("/ai-planner")}
            className="flex items-center gap-2.5 bg-[#FFAB40] text-white px-6 py-3.5 rounded-tr-2xl rounded-bl-2xl font-bold text-sm shadow-md hover:shadow-xl transition-all"
          >
            <Plus size={16} />
            Kiến tạo chuyến đi mới
          </motion.button>
        </div>

        {/* CONTROLS & FILTER TABS */}
        <div className="flex gap-2 mb-10 bg-white/40 backdrop-blur-md p-1.5 rounded-xl border border-[#E0F2F1] inline-flex flex-wrap">
          {[
            { value: "ALL", label: "Tất cả" },
            { value: "DRAFT", label: "Bản nháp" },
            { value: "CONFIRMED", label: "Đã lưu" },
            { value: "ONGOING", label: "Đang đi" },
            { value: "COMPLETED", label: "Hoàn thành" },
          ].map((f) => {
            const isSelected = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all relative ${
                  isSelected 
                    ? "bg-[#004D40] text-white shadow-sm" 
                    : "text-gray-500 hover:text-[#004D40] hover:bg-white/60"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* CARDS CONTAINER */}
        <AnimatePresence mode="wait">
          {trips.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-24 bg-white/40 backdrop-blur-md rounded-tr-[50px] rounded-bl-[50px] border border-dashed border-[#19e768] max-w-xl mx-auto p-8"
            >
              <div className="w-16 h-16 bg-[#E0F2F1] rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass size={28} className="text-[#004D40] opacity-80" />
              </div>
              <h3 className="text-xl font-cormorant font-bold text-[#004D40] mb-2">
                Trang giấy lịch trình còn trống
              </h3>
              <p className="text-gray-400 text-xs mb-6 max-w-xs mx-auto leading-relaxed">
                Đà Nẵng đang chờ bạn ghé thăm. Hãy để trợ lý AI phác thảo một hành trình đáng nhớ.
              </p>
              <button
                onClick={() => navigate("/ai-planner")}
                className="bg-white text-[#004D40] border border-[#E0F2F1] px-5 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold shadow-sm hover:bg-[#004D40] hover:text-white transition-all"
              >
                Trải nghiệm AI Planner
              </button>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {trips.map((trip) => (
                <motion.div
                  layout
                  key={trip._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={springTransition}
                  className="bg-white/80 backdrop-blur-md rounded-tr-[45px] rounded-bl-[45px] rounded-tl-xl rounded-br-xl shadow-sm hover:shadow-xl border border-[#E0F2F1]/80 overflow-hidden flex flex-col relative"
                >
                  {/* Status Tag Asymmetric Position */}
                  <div className="absolute top-4 right-4 z-10">
                    <span
                      className={`px-3 py-1 text-[10px] tracking-wider uppercase font-black rounded-tr-md rounded-bl-md shadow-sm backdrop-blur-sm ${
                        trip.status === "CONFIRMED"
                          ? "bg-[#FFAB40]/5 text-[#FFAB40] border border-[#FFAB40]/20"
                          : trip.status === "ONGOING"
                          ? "bg-blue-50/40 text-blue-700 border border-blue-200/50"
                          : trip.status === "COMPLETED"
                          ? "bg-emerald-50/40 text-emerald-600 border border-emerald-200/50"
                          : "bg-purple-50/40 text-purple-700 border border-purple-200/50"
                      }`}
                    >
                      {trip.status === "CONFIRMED" ? "Đã lưu" : trip.status === "ONGOING" ? "Đang diễn hành" : trip.status === "COMPLETED" ? "Đã hoàn thành" : "Nháp"}
                    </span>
                  </div>

                  {/* Card Header Content */}
                  <div className="p-6 pb-4 border-b border-gray-50 bg-gradient-to-b bg-[#016555] from-[#E0F2F1]/20 to-transparent">
                    <h3 className="text-2xl font-cormorant font-bold text-white leading-snug group-hover:text-[#00695C] transition-colors pr-16 line-clamp-1">
                      {trip.title || "Chuyến đi Đà Nẵng"}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-400 mt-1">
                      <MapPin size={12} className="text-[#FFAB40]" />
                      <span className="text-[10px] text-white font-bold tracking-widest uppercase">Da Nang City</span>
                    </div>
                  </div>

                  {/* Card Main Information Body */}
                  <div className="p-6 pt-4 flex-1 space-y-3.5">
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <div className="w-7 h-7 rounded-tr-lg rounded-bl-lg bg-[#E0F2F1]/50 flex items-center justify-center text-[#004D40]">
                        <Calendar size={14} />
                      </div>
                      <span>Khởi hành: <b className="text-gray-700 font-semibold">{formatDate(trip.startDate)}</b></span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <div className="w-7 h-7 rounded-tr-lg rounded-bl-lg bg-[#E0F2F1]/50 flex items-center justify-center text-[#004D40]">
                        <Clock size={14} />
                      </div>
                      <span>Thời gian khám phá: <b className="text-gray-700 font-semibold">{trip.days} Ngày</b></span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <div className="w-7 h-7 rounded-tr-lg rounded-bl-lg bg-[#E0F2F1]/50 flex items-center justify-center text-[#004D40]">
                        <DollarSign size={14} />
                      </div>
                      <span>Dự chi: <b className="text-[#004D40] text-sm font-bold">{trip.budget ? `${formatCurrency(trip.budget)}đ` : "Chưa lập tính"}</b></span>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="p-6 pt-0 mt-auto flex gap-2.5 flex-wrap">
                    <button
                      onClick={() => navigate(`/itinerary/${trip._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#E0F2F1] hover:bg-[#004D40] text-[#004D40] hover:text-white py-3 rounded-tr-xl rounded-bl-xl text-xs font-bold tracking-wider transition-all duration-300 min-w-[120px]"
                    >
                      <Eye size={13} />
                      XEM CHI TIẾT
                    </button>

                    {trip.status === "DRAFT" && (
                      <button
                        onClick={() => handleAdvanceStatus(trip._id, trip.status)}
                        disabled={updating === trip._id}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#FFAB40] hover:bg-[#f59e2b] text-white py-3 rounded-tr-xl rounded-bl-xl text-xs font-bold tracking-wider transition-all duration-300 disabled:opacity-50 min-w-[120px]"
                      >
                        {updating === trip._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        LƯU
                      </button>
                    )}

                    {/* 2. Nếu trạng thái là CONFIRMED -> Hiện nút BẮT ĐẦU ĐI KHỞI HÀNH */}
                    {trip.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleAdvanceStatus(trip._id, trip.status)}
                        disabled={updating === trip._id}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-tr-xl rounded-bl-xl text-xs font-bold tracking-wider transition-all duration-300 disabled:opacity-50 min-w-[120px]"
                      >
                        {updating === trip._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Play size={13} />
                        )}
                        KHỞI HÀNH ĐI
                      </button>
                    )}

                    {/* 3. Nếu trạng thái là ONGOING -> Hiện nút HOÀN THÀNH CHUYẾN ĐI */}
                    {trip.status === "ONGOING" && (
                      <button
                        onClick={() => handleAdvanceStatus(trip._id, trip.status)}
                        disabled={updating === trip._id}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-tr-xl rounded-bl-xl text-xs font-bold tracking-wider transition-all duration-300 disabled:opacity-50 min-w-[120px]"
                      >
                        {updating === trip._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <CheckCircle size={13} />
                        )}
                        HOÀN THÀNH
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(trip._id)}
                      className="px-3.5 py-3 border border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200 rounded-tr-xl rounded-bl-xl transition-all"
                    >
                      <Trash2 size={13} />
                    </button>

                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyItineraries;