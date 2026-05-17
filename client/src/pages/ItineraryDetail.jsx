import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
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
} from "lucide-react";

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
      alert("Không thể tải thông tin lịch trình");
      navigate("/my-itineraries");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (trip) {
      setEditTitle(trip.title || "");
      setEditItinerary(trip.itinerary || []);
    }
    setIsEditing(false);
  };

  const handleTimeChange = (dayIdx, activityIdx, newTime) => {
    setEditItinerary(prevItinerary => {
      const updated = JSON.parse(JSON.stringify(prevItinerary));
      updated[dayIdx].activities[activityIdx].time = newTime;
      return updated;
    });
  };

  const handleDeleteActivity = (dayIdx, activityIdx) => {
    setEditItinerary(prevItinerary => {
      const updated = JSON.parse(JSON.stringify(prevItinerary));
      updated[dayIdx].activities.splice(activityIdx, 1);
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    if (!editTitle.trim()) {
      alert("Tên lịch trình không được để trống!");
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      const response = await axios.put(
        `/api/trips/${id}`,
        {
          title: editTitle,
          itinerary: editItinerary,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert("🎉 Cập nhật lịch trình thành công!");
        setTrip(response.data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update trip error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ lịch trình này?")) return;
    try {
      const token = await getToken();
      await axios.delete(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Đã xóa lịch trình");
      navigate("/my-itineraries");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Có lỗi xảy ra khi xóa");
    }
  };

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
      .replace(/,?\s*TP. Đà Nẵng.*$/i, "")
      .replace(/,?\s*TP. *$/i, "")
      .trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004D40]" size={40} />
      </div>
    );
  }

  if (!trip) return null;

  const cardStyle = "bg-white border border-[#E0F2F1]/80 overflow-hidden shadow-[0_4px_20px_rgba(0,77,64,0.02)] transition-all flex h-full rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl relative";
  const btnActionStyle = "flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold transition-all rounded-tr-xl rounded-bl-xl shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F7F3] via-[#F5F5F5] to-white pt-28 pb-20 px-4 font-jakarta relative">
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 border-b border-[#E0F2F1]/60 pb-6">
          <div className="w-full md:w-auto flex-1">
            <button
              onClick={() => navigate("/my-itineraries")}
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
              >{trip.status === "CONFIRMED" ? "Đã lưu" : trip.status === "ONGOING" ? "Đang diễn hành" : trip.status === "COMPLETED" ? "Đã hoàn thành" : "Nháp"}
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
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
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

        {/* STATS TỔNG QUAN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {[
            { icon: <Calendar size={18} />, label: "Ngày khởi hành", value: formatDate(trip.startDate), bg: "bg-orange-50 text-orange-600" },
            { icon: <Clock size={18} />, label: "Thời gian dự kiến", value: `${trip.days} ngày`, bg: "bg-teal-50 text-[#004D40]" },
            { icon: <Users size={18} />, label: "Số người đi", value: `${trip.peopleCount} người`, bg: "bg-teal-50 text-[#FFAB40]" },
          ].map((s, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md p-4 rounded-tr-2xl rounded-bl-2xl border border-[#E0F2F1]/60 flex items-center gap-4 shadow-sm">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{s.label}</p>
                <p className="text-xs font-bold text-[#004D40]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* THÔNG BÁO THAY ĐỔI */}
        <div className="mb-8 p-4 rounded-tr-2xl rounded-bl-2xl bg-blue-50 border border-blue-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">ℹ</div>
            <p className="text-sm text-blue-700 leading-relaxed">
              <span className="font-bold">Lưu ý:</span> Nếu bạn muốn thay đổi ngày khởi hành hoặc số ngày đi, vui lòng{" "}
              <Link to="/ai-trip-planner" className="font-bold underline hover:text-blue-800 transition-colors">
                kiến tạo chuyến mới
              </Link>
              . Tính năng tinh chỉnh dùng để thay đổi mốc giờ, xóa địa điểm hoặc thêm hoạt động trực tiếp vào từng ngày.
            </p>
          </div>
        </div>

        {/* LỊCH TRÌNH CHI TIẾT CANVAS */}
        <section>
          <h3 className="flex items-center gap-2.5 text-2xl font-bold font-cormorant text-[#004D40] mb-10">
            <Clock size={22} className="text-[#FFAB40]" /> Chi tiết dòng chảy thời gian
          </h3>

          <div className="relative border-l-2 border-dashed border-[#E0F2F1] ml-4 md:ml-6 space-y-12">
            {editItinerary?.map((day, dayIdx) => (
              <div key={dayIdx} className="relative pl-8 md:pl-10 pb-4">
                <div className="absolute -left-[9px] top-2.5 w-4 h-4 bg-[#004D40] rounded-full border-4 border-white shadow-sm" />

                <div className="mb-6 inline-flex items-center px-4 py-1.5 bg-[#004D40] rounded-tr-xl rounded-bl-xl text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                  Ngày {day.dayNumber}
                </div>

                {/* DANH SÁCH HOẠT ĐỘNG */}
                <div className="space-y-6 mb-6">
                  {day.activities?.map((item, activityIdx) => {
                    const service = item.serviceId;
                    if (!service) return null;

                    const isRestaurant = service.type === "RESTAURANT";

                    {/* GIẢI QUYẾT LỖI GÕ CHỮ: Nếu đang sửa, đổi thẻ bọc từ Link thành div */}
                    const WrapperComponent = isEditing ? "div" : Link;
                    const wrapperProps = isEditing 
                      ? { className: "block relative group max-w-3xl" } 
                      : { to: `/services/${service._id}`, className: "block relative group max-w-3xl" };

                    return (
                      <WrapperComponent key={activityIdx} {...wrapperProps}>
                        
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteActivity(dayIdx, activityIdx)}
                            className="absolute -top-2 -right-2 z-20 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors pointer-events-auto"
                            title="Xóa điểm này"
                          >
                            <X size={14} />
                          </button>
                        )}

                        <motion.div whileHover={isEditing ? {} : { x: 8 }} className={cardStyle}>
                          
                          {/* Khung ảnh + Ô nhập giờ */}
                          <div className="w-1/4 min-w-[140px] relative overflow-hidden bg-gray-100">
                            <img
                              src={service.thumbnail}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Ô NHẬP GIỜ ĐÃ ĐƯỢC FIX LỖI KHÔNG GÕ ĐƯỢC */}
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-md backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 bg-[#004D40]/80 z-10">
                              <Clock size={10} />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={item.time || ""}
                                  onChange={(e) => handleTimeChange(dayIdx, activityIdx, e.target.value)}
                                  className="bg-transparent border-b border-white outline-none w-14 text-center text-[10px] p-0 font-bold text-white focus:border-[#FFAB40]"
                                />
                              ) : (
                                <span>{item.time}</span>
                              )}
                            </div>
                          </div>

                          {/* Nội dung điểm đến */}
                          <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest mb-1 ${isRestaurant ? "bg-orange-50 text-orange-600" : "bg-teal-50 text-[#004D40]"}`}>
                                    {isRestaurant ? "Ẩm thực" : "Trải nghiệm"}
                                  </span>
                                  <h4 className="text-lg font-bold text-[#004D40] font-cormorant truncate mb-1">
                                    {service.name}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-100 rounded text-[11px] font-bold text-amber-700 flex-shrink-0">
                                  <Star size={11} className="fill-amber-400 text-amber-400" />
                                  <span>{service.ratingStats?.averageRating || 5.0}</span>
                                </div>
                              </div>

                              <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate mb-2">
                                <MapPin size={11} /> {getCleanAddress(service.address)}
                              </p>

                              <div className={`p-2.5 rounded-xl border border-dashed text-[11px] italic leading-relaxed line-clamp-2 text-gray-500 ${isRestaurant ? "bg-orange-50/20 border-orange-100" : "bg-teal-50/20 border-teal-100"}`}>
                                "{service.description}"
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dự chi một người</span>
                                <span className="text-base font-black text-[#004D40]">
                                  {formatCurrency(service.finalPrice || service.pricePerUnit)}đ
                                </span>
                              </div>

                              {!isEditing && (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-tr-xl rounded-bl-xl ${isRestaurant ? "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white" : "bg-teal-50 text-[#004D40] group-hover:bg-[#004D40] group-hover:text-white"} transition-all`}>
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

                {/* ➕ NÚT DẤU CỘNG THÊM HOẠT ĐỘNG THEO TIÊU CHUẨN DESIGN SYSTEM D-PULSE */}
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/services?fromItinerary=${id}&targetDay=${day.dayNumber}`)}
                    className="flex items-center gap-2 border-2 border-dashed border-[#E0F2F1] hover:border-[#004D40] text-gray-400 hover:text-[#004D40] bg-white/60 hover:bg-white w-full max-w-3xl py-3.5 rounded-tr-2xl rounded-bl-2xl justify-center text-xs font-bold transition-all tracking-wider shadow-sm"
                  >
                    <Plus size={14} className="text-[#FFAB40]" />
                    THÊM HOẠT ĐỘNG CHO NGÀY {day.dayNumber}
                  </motion.button>
                )}

              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ItineraryDetail;