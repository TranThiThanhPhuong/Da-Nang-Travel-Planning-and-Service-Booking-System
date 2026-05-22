import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Save,
  X,
  Users,
  Plus,
  Heart,
  Compass,
  TicketCheck,
} from "lucide-react";
import FeedbackModal from "../components/FeedbackModal";

const ItineraryDetail = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editItinerary, setEditItinerary] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Panel thêm hoạt động
  const [activeDayIndex, setActiveDayIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("wishlist"); // "wishlist" | "booked"

  // Dữ liệu cho 2 tab
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // FeedbackModal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const closeModal = () =>
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const showModal = (config) =>
    setModalConfig({ isOpen: true, onConfirm: null, ...config });

  // ── Fetch trip ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTripDetail();
  }, [id]);

  const fetchTripDetail = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const tripData = response.data.data;
        setTrip(tripData);
        setEditTitle(tripData.title || "");
        setEditItinerary(tripData.itinerary || []);
      }
    } catch (error) {
      console.error("Fetch trip detail error:", error);
      showModal({
        type: "error",
        title: "Không thể tải dữ liệu",
        message: "Không thể tải thông tin lịch trình. Vui lòng thử lại.",
      });
      navigate("/account?tab=itineraries");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch wishlist (lazy, cache trong session) ─────────────────────
  const fetchWishlist = async () => {
    if (wishlist.length > 0) return; // đã có cache
    setLoadingWishlist(true);
    try {
      const token = await getToken();
      const response = await axios.get("/api/wishlists/my-wishlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setWishlist(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch wishlist error:", error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  // ── Fetch bookings PAID (luôn refetch khi mở panel để cập nhật mới nhất) ──
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const token = await getToken();
      const response = await axios.get("/api/bookings/my-bookings?status=PAID", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setBookings(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // ── Mở/đóng panel thêm hoạt động ──────────────────────────────────
  const handleOpenAddOptions = (dayIdx) => {
    if (activeDayIndex === dayIdx) {
      // Đóng panel — reset tab về mặc định
      setActiveDayIndex(null);
      setActiveTab("wishlist");
      return;
    }

    setActiveDayIndex(dayIdx);
    setActiveTab("wishlist");

    // Fetch cả 2 nguồn song song
    fetchWishlist();
    fetchBookings();
  };

  // ── Chèn từ Wishlist vào lịch trình ───────────────────────────────
  const handleSelectFromWishlist = (dayIdx, serviceItem) => {
    setEditItinerary((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[dayIdx].activities.push({
        time: "08:00",
        serviceId: {
          _id: serviceItem._id,
          name: serviceItem.name,
          thumbnail: serviceItem.thumbnail,
          type: serviceItem.type,
          address: serviceItem.address,
          description: serviceItem.description,
          finalPrice: serviceItem.finalPrice,
          price: serviceItem.pricePerUnit || serviceItem.price,
          discountedPrice: serviceItem.finalPrice || serviceItem.price,
          ratingStats: serviceItem.ratingStats,
        },
      });
      return updated;
    });
    setActiveDayIndex(null);
    setActiveTab("wishlist");
  };

  // ── Chèn từ Booking đã thanh toán vào lịch trình ─────────────────
  // booking.serviceId đã được populate từ API
  const handleSelectFromBooking = (dayIdx, booking) => {
    const s = booking.serviceId; // object đã populate
    if (!s) return;

    setEditItinerary((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[dayIdx].activities.push({
        time: "08:00",
        serviceId: {
          _id: s._id,
          name: s.name,
          thumbnail: s.thumbnail,
          type: s.type,
          address: s.address,
          description: s.description,
          finalPrice: s.finalPrice,
          price: s.pricePerUnit || s.price,
          discountedPrice: s.finalPrice || s.price,
          ratingStats: s.ratingStats,
        },
      });
      return updated;
    });
    setActiveDayIndex(null);
    setActiveTab("wishlist");
  };

  // ── Chỉnh thời gian ───────────────────────────────────────────────
  const handleTimeChange = (dayIdx, actIdx, newTime) => {
    setEditItinerary((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[dayIdx].activities[actIdx].time = newTime;
      return updated;
    });
  };

  // ── Xóa hoạt động ─────────────────────────────────────────────────
  const handleDeleteActivity = (dayIdx, actIdx) => {
    setEditItinerary((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[dayIdx].activities.splice(actIdx, 1);
      return updated;
    });
  };

  // ── Hủy chỉnh sửa ─────────────────────────────────────────────────
  const handleCancelEdit = () => {
    if (trip) {
      setEditTitle(trip.title || "");
      setEditItinerary(trip.itinerary || []);
    }
    setIsEditing(false);
    setActiveDayIndex(null);
  };

  // ── Lưu thay đổi ──────────────────────────────────────────────────
  const handleSaveChanges = async () => {
    if (!editTitle.trim()) {
      return showModal({
        type: "warning",
        title: "Thiếu thông tin",
        message: "Tên lịch trình không được để trống!",
      });
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const payloadItinerary = editItinerary.map((day) => ({
        dayNumber: day.dayNumber,
        date: day.date,
        activities: day.activities.map((act) => {
          const s = act.serviceId;
          return {
            time: act.time,
            serviceId: s?._id || s,
            name: s?.name || act.name,
            type: s?.type || act.type,
            address: s?.address || act.address,
            price: s?.pricePerUnit || s?.price || act.price,
            discountedPrice: s?.finalPrice || act.discountedPrice,
            thumbnail: s?.thumbnail || act.thumbnail,
            ratingStats: s?.ratingStats || act.ratingStats,
            description: s?.description || act.description,
          };
        }),
      }));

      const response = await axios.put(
        `/api/trips/${id}`,
        { title: editTitle, itinerary: payloadItinerary },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showModal({
          type: "success",
          title: "Cập nhật thành công!",
          message: "Lịch trình của bạn đã được lưu lại.",
        });
        setTrip({ ...response.data.data, itinerary: editItinerary });
        setIsEditing(false);
        setActiveDayIndex(null);
      }
    } catch (error) {
      console.error("Update trip error:", error);
      showModal({
        type: "error",
        title: "Cập nhật thất bại",
        message:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Xóa lịch trình ────────────────────────────────────────────────
  const handleDeleteTrip = () => {
    showModal({
      type: "confirm",
      title: "Xóa lịch trình",
      message:
        "Bạn có chắc muốn xóa toàn bộ lịch trình này? Hành động này không thể hoàn tác.",
      onConfirm: executeDeleteTrip,
    });
  };

  const executeDeleteTrip = async () => {
    showModal({
      type: "loading",
      title: "Đang xóa...",
      message: "Hệ thống đang xử lý yêu cầu xóa lịch trình.",
    });
    try {
      const token = await getToken();
      await axios.delete(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showModal({
        type: "success",
        title: "Đã xóa lịch trình",
        message: "Lịch trình đã được xóa thành công.",
      });
      setTimeout(() => navigate("/account?tab=itineraries"), 1500);
    } catch (error) {
      console.error("Delete error:", error);
      showModal({
        type: "error",
        title: "Xóa thất bại",
        message: "Có lỗi xảy ra khi xóa lịch trình. Vui lòng thử lại.",
      });
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount);

  const getCleanAddress = (address) => {
    if (!address) return "";
    return address
      .replace(/,?\s*Thành phố Đà Nẵng.*$/i, "")
      .replace(/,?\s*Đà Nẵng.*$/i, "")
      .replace(/,?\s*TP\. Đà Nẵng.*$/i, "")
      .replace(/,?\s*TP\. *$/i, "")
      .trim();
  };

  // ── Loading / Not found ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004D40]" size={40} />
      </div>
    );
  }

  if (!trip) return null;

  const cardStyle =
    "bg-white border border-[#E0F2F1]/80 overflow-hidden shadow-[0_4px_20px_rgba(0,77,64,0.02)] transition-all flex h-full rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl relative";

  const btnActionStyle =
    "flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold transition-all rounded-tr-xl rounded-bl-xl shadow-sm";

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F7F3] via-[#F5F5F5] to-white pt-28 pb-20 px-4 font-jakarta relative">
      <div className="max-w-4xl mx-auto relative z-10">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 border-b border-[#E0F2F1]/60 pb-6">
          <div className="w-full md:w-auto flex-1">
            <button
              onClick={() => navigate("/account?tab=itineraries")}
              className="flex items-center gap-2 text-[#004D40] hover:text-[#00332A] mb-3 text-xs font-bold uppercase tracking-wider"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </button>

            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-3xl font-cormorant font-bold text-[#004D40] bg-white border-b-2 border-[#004D40] outline-none py-1 focus:border-[#FFAB40] transition-colors"
                placeholder="Nhập tên chuyến đi..."
              />
            ) : (
              <h1 className="text-4xl font-cormorant font-bold text-[#004D40] mb-2 leading-tight">
                {trip.title}
              </h1>
            )}

            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 text-[10px] tracking-wider uppercase font-black rounded-tr-md rounded-bl-md shadow-sm ${
                  trip.status === "CONFIRMED"
                    ? "bg-blue-50/90 text-blue-700 border border-blue-200"
                    : trip.status === "ONGOING"
                    ? "bg-purple-50/90 text-purple-700 border border-purple-200"
                    : trip.status === "COMPLETED"
                    ? "bg-emerald-50/90 text-emerald-700 border border-emerald-200"
                    : "bg-[#FFAB40]/10 text-[#FFAB40] border border-[#FFAB40]/30"
                }`}
              >
                {trip.status === "CONFIRMED"
                  ? "Đã lưu"
                  : trip.status === "ONGOING"
                  ? "Đang diễn hành"
                  : trip.status === "COMPLETED"
                  ? "Đã hoàn thành"
                  : "Nháp"}
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveChanges}
                  disabled={submitting}
                  className={`${btnActionStyle} bg-[#004D40] text-white hover:bg-[#00332A]`}
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  Lưu lại
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className={`${btnActionStyle} border border-gray-300 text-gray-500 bg-white hover:bg-gray-50`}
                >
                  <X size={14} /> Hủy
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`${btnActionStyle} border border-emerald-600 bg-emerald-600 text-white hover:bg-[#00352D] shadow-md`}
                >
                  <Edit size={14} /> Tinh chỉnh
                </button>
                <button
                  onClick={handleDeleteTrip}
                  className={`${btnActionStyle} border border-red-200 text-red-500 bg-white hover:bg-red-50/50`}
                >
                  <Trash2 size={14} /> Xóa lịch trình
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── STATS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {[
            {
              icon: <Calendar size={18} />,
              label: "Ngày khởi hành",
              value: formatDate(trip.startDate),
              bg: "bg-orange-50 text-orange-600",
            },
            {
              icon: <Clock size={18} />,
              label: "Thời gian dự kiến",
              value: `${trip.days} ngày`,
              bg: "bg-teal-50 text-[#004D40]",
            },
            {
              icon: <Users size={18} />,
              label: "Số người đi",
              value: `${trip.peopleCount} người`,
              bg: "bg-teal-50 text-[#FFAB40]",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-md p-4 rounded-tr-2xl rounded-bl-2xl border border-[#E0F2F1]/60 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  {s.label}
                </p>
                <p className="text-xs font-bold text-[#004D40]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── THÔNG BÁO ──────────────────────────────────────────────── */}
        <div className="mb-8 p-4 rounded-tr-2xl rounded-bl-2xl bg-blue-50 border border-blue-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
              ℹ
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">
              <span className="font-bold">Lưu ý:</span> Nếu bạn muốn thay đổi
              ngày khởi hành hoặc số ngày đi, vui lòng{" "}
              <Link
                to="/ai-trip-planner"
                className="font-bold underline hover:text-blue-800 transition-colors"
              >
                kiến tạo chuyến mới
              </Link>
              . Tính năng tinh chỉnh dùng để thay đổi mốc giờ, xóa địa điểm
              hoặc thêm hoạt động trực tiếp vào từng ngày.
            </p>
          </div>
        </div>

        {/* ── TIMELINE ───────────────────────────────────────────────── */}
        <section>
          <h3 className="flex items-center gap-2.5 text-2xl font-bold font-cormorant text-[#004D40] mb-10">
            <Clock size={22} className="text-[#FFAB40]" /> Chi tiết dòng chảy
            thời gian
          </h3>

          <div className="relative border-l-2 border-dashed border-[#E0F2F1] ml-4 md:ml-6 space-y-12">
            {editItinerary?.map((day, dayIdx) => (
              <div key={dayIdx} className="relative pl-8 md:pl-10 pb-4">
                <div className="absolute -left-[9px] top-2.5 w-4 h-4 bg-[#004D40] rounded-full border-4 border-white shadow-sm" />

                <div className="mb-6 inline-flex items-center px-4 py-1.5 bg-[#004D40] rounded-tr-xl rounded-bl-xl text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                  Ngày {day.dayNumber}
                </div>

                {/* Danh sách hoạt động */}
                <div className="space-y-6 mb-6">
                  {day.activities?.map((item, actIdx) => {
                    const service = item.serviceId;
                    if (!service) return null;

                    const isRestaurant = service.type === "RESTAURANT";
                    const WrapperComponent = isEditing ? "div" : Link;
                    const wrapperProps = isEditing
                      ? { className: "block relative group max-w-3xl" }
                      : {
                          to: `/services/${service._id}`,
                          className: "block relative group max-w-3xl",
                        };

                    return (
                      <WrapperComponent key={actIdx} {...wrapperProps}>
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteActivity(dayIdx, actIdx)}
                            className="absolute -top-2 -right-2 z-20 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                            title="Xóa điểm này"
                          >
                            <X size={14} />
                          </button>
                        )}

                        <motion.div
                          whileHover={isEditing ? {} : { x: 8 }}
                          className={cardStyle}
                        >
                          {/* Ảnh + giờ */}
                          <div className="w-1/4 min-w-[140px] relative overflow-hidden bg-gray-100">
                            <img
                              src={service.thumbnail}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-md backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 bg-[#004D40]/80 z-10">
                              <Clock size={10} />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={item.time || ""}
                                  onChange={(e) =>
                                    handleTimeChange(dayIdx, actIdx, e.target.value)
                                  }
                                  className="bg-transparent border-b border-white outline-none w-14 text-center text-[10px] p-0 font-bold text-white focus:border-[#FFAB40]"
                                />
                              ) : (
                                <span>{item.time}</span>
                              )}
                            </div>
                          </div>

                          {/* Nội dung */}
                          <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                                        isRestaurant
                                          ? "bg-orange-50 text-orange-600"
                                          : "bg-teal-50 text-[#004D40]"
                                      }`}
                                    >
                                      {isRestaurant ? "Ẩm thực" : "Trải nghiệm"}
                                    </span>

                                    {item.isBooked && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider border border-emerald-200 shadow-sm">
                                        ✓ Đã đặt chỗ ({item.bookingCode})
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-lg font-bold text-[#004D40] font-cormorant truncate mb-1">
                                    {service.name}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-100 rounded text-[11px] font-bold text-amber-700 flex-shrink-0">
                                  <Star
                                    size={11}
                                    className="fill-amber-400 text-amber-400"
                                  />
                                  <span>
                                    {service.ratingStats?.averageRating || 5.0}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate mb-2">
                                <MapPin size={11} />
                                {getCleanAddress(service.address)}
                              </p>

                              <div
                                className={`p-2.5 rounded-xl border border-dashed text-[11px] italic leading-relaxed line-clamp-2 text-gray-500 ${
                                  isRestaurant
                                    ? "bg-orange-50/20 border-orange-100"
                                    : "bg-teal-50/20 border-teal-100"
                                }`}
                              >
                                "{service.description}"
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                  Dự chi một người
                                </span>
                                <span className="text-base font-black text-[#004D40]">
                                  {formatCurrency(
                                    service.finalPrice || service.pricePerUnit
                                  )}
                                  đ
                                </span>
                              </div>

                              {!isEditing && (
                                <div
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-tr-xl rounded-bl-xl transition-all ${
                                    isRestaurant
                                      ? "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white"
                                      : "bg-teal-50 text-[#004D40] group-hover:bg-[#004D40] group-hover:text-white"
                                  }`}
                                >
                                  Chi tiết <ExternalLink size={12} />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </WrapperComponent>
                    );
                  })}
                </div>

                {/* ── NÚT THÊM HOẠT ĐỘNG ───────────────────────────── */}
                {isEditing && (
                  <div className="w-full max-w-3xl space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleOpenAddOptions(dayIdx)}
                      className={`flex items-center gap-2 border-2 border-dashed w-full py-3.5 rounded-tr-2xl rounded-bl-2xl justify-center text-xs font-bold transition-all tracking-wider shadow-sm ${
                        activeDayIndex === dayIdx
                          ? "border-[#FFAB40] text-[#FFAB40] bg-amber-50/20"
                          : "border-[#E0F2F1] text-gray-400 bg-white/60 hover:border-[#004D40] hover:text-[#004D40]"
                      }`}
                    >
                      {activeDayIndex === dayIdx ? (
                        <X size={14} />
                      ) : (
                        <Plus size={14} className="text-[#FFAB40]" />
                      )}
                      {activeDayIndex === dayIdx
                        ? "ĐÓNG LỰA CHỌN"
                        : `THÊM HOẠT ĐỘNG CHO NGÀY ${day.dayNumber}`}
                    </motion.button>

                    {/* ── PANEL CHỌN NGUỒN ─────────────────────────── */}
                    <AnimatePresence>
                      {activeDayIndex === dayIdx && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white border border-[#E0F2F1] rounded-tr-3xl rounded-bl-3xl p-5 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-5"
                        >
                          {/* Cột trái: mẹo */}
                          <div className="md:col-span-1 flex flex-col justify-between border-r border-gray-100 pr-4">
                            <div>
                              <p className="text-[11px] font-bold text-[#004D40] uppercase mb-2 tracking-wider flex items-center gap-1">
                                <Compass size={13} className="text-[#FFAB40]" />
                                Mẹo tìm kiếm
                              </p>
                              <p className="text-xs text-gray-500 leading-relaxed">
                                Chọn từ{" "}
                                <span className="text-red-500 font-bold">
                                  ♥ Yêu thích
                                </span>{" "}
                                hoặc chèn trực tiếp{" "}
                                <span className="text-emerald-600 font-bold">
                                  vé đã thanh toán
                                </span>{" "}
                                vào khung thời gian trong 1-click!
                              </p>
                            </div>
                            <button
                              onClick={() => navigate("/services")}
                              className="mt-4 flex items-center justify-center gap-2 border border-[#004D40] text-[#004D40] bg-white hover:bg-teal-50/40 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              Tìm kiếm dịch vụ mới
                            </button>
                          </div>

                          {/* Cột phải: tab wishlist / booked */}
                          <div className="md:col-span-2 flex flex-col">
                            {/* Tab headers */}
                            <div className="flex border-b border-gray-100 mb-3 gap-4">
                              <button
                                onClick={() => setActiveTab("wishlist")}
                                className={`pb-2 px-1 text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all relative ${
                                  activeTab === "wishlist"
                                    ? "text-[#004D40]"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                              >
                                <Heart
                                  size={12}
                                  className={
                                    activeTab === "wishlist"
                                      ? "text-red-500 fill-red-500"
                                      : ""
                                  }
                                />
                                Yêu thích ({wishlist.length})
                                {activeTab === "wishlist" && (
                                  <motion.div
                                    layoutId={`tab-indicator-${dayIdx}`}
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004D40]"
                                  />
                                )}
                              </button>

                              <button
                                onClick={() => setActiveTab("booked")}
                                className={`pb-2 px-1 text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all relative ${
                                  activeTab === "booked"
                                    ? "text-[#004D40]"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                              >
                                <TicketCheck
                                  size={12}
                                  className={
                                    activeTab === "booked"
                                      ? "text-emerald-600"
                                      : ""
                                  }
                                />
                                Vé đã đặt ({bookings.length})
                                {activeTab === "booked" && (
                                  <motion.div
                                    layoutId={`tab-indicator-${dayIdx}`}
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004D40]"
                                  />
                                )}
                              </button>
                            </div>

                            {/* Tab content */}
                            <div className="flex-1 min-h-[120px]">
                              {activeTab === "wishlist" ? (
                                // ── Tab Yêu thích ──────────────────
                                loadingWishlist ? (
                                  <div className="flex items-center justify-center py-8 text-xs text-gray-400 gap-2">
                                    <Loader2
                                      size={14}
                                      className="animate-spin text-[#004D40]"
                                    />
                                    Đang đồng bộ danh sách...
                                  </div>
                                ) : wishlist.length === 0 ? (
                                  <div className="text-xs text-gray-400 italic py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    Danh sách yêu thích của bạn đang trống.
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                    {wishlist.map((fav) => (
                                      <div
                                        key={fav._id}
                                        onClick={() =>
                                          handleSelectFromWishlist(dayIdx, fav)
                                        }
                                        className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100/70 hover:border-teal-200 hover:bg-teal-50/30 cursor-pointer transition-all group"
                                      >
                                        <img
                                          src={fav.thumbnail}
                                          alt={fav.name}
                                          className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-sm"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold text-[#004D40] group-hover:text-teal-700 transition-colors truncate">
                                            {fav.name}
                                          </p>
                                          <p className="text-[10px] text-gray-400 truncate">
                                            {getCleanAddress(fav.address)}
                                          </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 pl-2">
                                          <span className="text-xs font-black text-[#004D40]">
                                            {formatCurrency(
                                              fav.finalPrice ||
                                                fav.pricePerUnit ||
                                                fav.price
                                            )}
                                            đ
                                          </span>
                                          <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            + Chèn điểm
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                              ) : (
                                // ── Tab Vé đã đặt ──────────────────
                                loadingBookings ? (
                                  <div className="flex items-center justify-center py-8 text-xs text-gray-400 gap-2">
                                    <Loader2
                                      size={14}
                                      className="animate-spin text-[#004D40]"
                                    />
                                    Đang tải danh sách vé...
                                  </div>
                                ) : bookings.length === 0 ? (
                                  <div className="text-xs text-gray-400 italic py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    Bạn chưa có đơn đặt dịch vụ nào đã thanh toán.
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                    {bookings.map((b) => {
                                      const s = b.serviceId;
                                      if (!s) return null;
                                      return (
                                        <div
                                          key={b._id}
                                          onClick={() =>
                                            handleSelectFromBooking(dayIdx, b)
                                          }
                                          className="flex items-center gap-3 p-2.5 rounded-xl border border-emerald-100/60 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer transition-all group"
                                        >
                                          <img
                                            src={s.thumbnail}
                                            alt={s.name}
                                            className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-sm"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                              <p className="text-xs font-bold text-[#004D40] truncate group-hover:text-emerald-700 transition-colors">
                                                {s.name}
                                              </p>
                                              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                                                {b.bookingCode}
                                              </span>
                                            </div>
                                            <p className="text-[9px] text-gray-400 truncate">
                                              Hạn đi:{" "}
                                              {new Date(
                                                b.bookingDetails.checkInDate
                                              ).toLocaleDateString("vi-VN")}
                                            </p>
                                          </div>
                                          <div className="text-right flex-shrink-0 pl-2">
                                            <span className="text-xs font-black text-emerald-700">
                                              {formatCurrency(
                                                b.bookingDetails.totalPrice
                                              )}
                                              đ
                                            </span>
                                            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                              + Vào lịch trình
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <FeedbackModal {...modalConfig} onClose={closeModal} />
    </div>
  );
};

export default ItineraryDetail;