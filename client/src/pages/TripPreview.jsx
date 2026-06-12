import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Clock,
  Save,
  Edit,
  ExternalLink,
  Hotel,
  MapPin,
  Star,
  Users,
  Trash2,
  Heart,
  Info
} from "lucide-react";

const TripPreview = ({ trip, onSave, onCancel, wishlistIds = [], onToggleWishlist }) => {
  const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount);

  const getCleanAddress = (address) => {
    if (!address) return "";
    return address
      .replace(/,?\s*Thành phố Đà Nẵng.*$/i, "")
      .replace(/,?\s*Đà Nẵng.*$/i, "")
      .replace(/,?\s*TP. Đà Nẵng.*$/i, "")
      .replace(/,?\s*TP. *$/i, "").trim();
  };

  const cardStyle = "bg-white border border-teal-50 overflow-hidden shadow-[0_4px_20px_rgba(0,77,64,0.03)] hover:shadow-[0_12px_30px_rgba(0,77,64,0.08)] transition-all flex h-full rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl";
  const btnActionStyle = "flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold transition-all rounded-tr-xl rounded-bl-xl";

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 md:px-8 font-jakarta">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-10 mb-10">
        <h1 className="text-3xl md:text-4xl font-cormorant font-bold text-[#004D40]">{trip.title}</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={onSave} className={`${btnActionStyle} border border-emerald-600 bg-emerald-600 text-white hover:bg-[#00352D] shadow-md`}><Save size={14} /> Lưu lịch trình</button>
          <button onClick={onCancel} className={`${btnActionStyle} border border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200 bg-white hover:bg-teal-50 shadow-sm`}><Trash2 size={14} />Bỏ lịch trình</button></div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: <Calendar size={20} />, label: "Ngày đi", value: formatDate(trip.startDate), bg: "bg-orange-50 text-orange-600" },
          { icon: <Clock size={20} />, label: "Thời gian", value: `${trip.days} ngày`, bg: "bg-teal-50 text-[#004D40]" },
          { icon: <Users size={18} />, label: "Số người đi", value: `${trip.peopleCount} người`, bg: "bg-teal-50 text-[#FFAB40]" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-tr-xl rounded-bl-xl border border-gray-100 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-[#004D40]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 1. HOTELS SECTION (2 Cards per row) */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="flex items-center gap-2.5 text-2xl font-bold font-cormorant text-[#004D40]"><Hotel size={24} />Gợi ý chỗ ở</h3>
          
          {/* Nhắc nhở thông minh cho khách hàng về việc mất dữ liệu chỗ ở */}
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50/80 px-4 py-2.5 rounded-xl border border-amber-100 max-w-xl font-medium">
            <Info size={14} className="shrink-0 text-[#FFAB40]" />
            <span>Mẹo: Hãy bấm <Heart size={12} className="inline fill-amber-500 text-amber-500" /> yêu thích khách sạn bạn ưng ý.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trip.suggestedHotels?.map((hotel) => {
            const isFavorite = wishlistIds.includes(hotel._id);

            return (
              <div key={hotel._id} className="group relative">
                <motion.div whileHover={{ y: -4 }} className={cardStyle}>
                  {/* Nút yêu thích (Trái tim) đặt ở góc ảnh */}
                  <button 
                    onClick={() => onToggleWishlist(hotel._id)}
                    className="absolute top-3 left-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 hover:bg-white"
                  >
                    <Heart 
                      size={18} 
                      className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`} 
                    />
                  </button>
                  <div className="w-1/3 min-w-[140px] relative overflow-hidden bg-gray-100">
                    <img src={hotel.thumbnail} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="w-2/3 p-5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 title={hotel.name} className="font-bold text-[#004D40] text-base truncate flex-1">{hotel.name}</h4>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded-md flex-shrink-0">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-bold text-amber-600">{hotel.ratingStats?.averageRating || 5.0}</span>
                        </div>
                      </div>
                      <p title={hotel.address} className="text-[11px] text-gray-400 flex items-center gap-1 truncate mb-2"><MapPin size={12} /> {getCleanAddress(hotel.address)}</p>
                      <p title={hotel.description} className="text-[11px] text-gray-500 italic line-clamp-2 bg-gray-50 p-2 rounded-lg">“{hotel.description || "Không gian nghỉ dưỡng tuyệt vời."}”</p>
                    </div>
                    
                    <div className="pt-3 mt-2 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-base font-black text-[#004D40]">{formatCurrency(hotel.finalPrice || hotel.price)}đ</span>
                      
                      {/* Chỉ bọc link điều hướng ở nút Xem chi tiết */}
                      <Link 
                        to={`/services/${hotel._id}`} 
                        className="w-8 h-8 bg-[#E0F2F1] text-[#004D40] rounded-full flex items-center justify-center hover:bg-[#004D40] hover:text-white transition-all transform hover:rotate-45"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. ITINERARY SECTION */}
      <section>
        <h3 className="flex items-center gap-3 text-2xl font-bold font-cormorant text-[#004D40] mb-12"><Clock size={26} /> Lịch trình trải nghiệm(Lưu lại để chỉnh sửa)</h3>
        <div className="relative border-l-2 border-dashed border-gray-200 ml-4 md:ml-6 space-y-12">
          {trip.itinerary?.map((day, dayIdx) => (
            <div key={dayIdx} className="relative pl-8 md:pl-12">
              <div className="absolute -left-[9px] top-2 w-4 h-4 bg-[#004D40] rounded-full border-4 border-white shadow-sm" />
              <div className="mb-6 inline-flex items-center px-4 py-2.5 bg-white rounded-full border border-gray-100 shadow-sm text-xs font-black text-[#004D40] uppercase tracking-tighter">Ngày {day.day}, {day.date ? new Date(day.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" }) : ""}</div>

              <div className="space-y-6">
                {day.activities?.map((item, itemIdx) => {
                  const isRestaurant = item.type === "RESTAURANT";
                  const detail = (isRestaurant ? trip.rawResources?.restaurants : trip.rawResources?.activities)
                    ?.find((res) => String(res._id) === String(item.serviceId));
                  if (!detail) return null;

                  return (
                    <Link to={`/services/${detail._id}`} key={itemIdx} className="group block max-w-4xl">
                      <motion.div whileHover={{ x: 10 }} className={cardStyle}>
                        <div className="w-1/4 min-w-[160px] relative overflow-hidden">
                          <img src={detail.thumbnail} alt={detail.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 ${isRestaurant ? "bg-[#FFAB40]/90" : "bg-[#004D40]/90"}`}>
                            <Clock size={10} /> {item.time}
                          </div>
                        </div>

                        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest mb-1 ${isRestaurant ? "bg-orange-50 text-orange-600" : "bg-teal-50 text-[#004D40]"}`}>
                                  {isRestaurant ? "Ẩm thực" : "Trải nghiệm"}
                                </span>
                                <h4 title={detail.name} className="text-xl font-bold text-[#004D40] font-cormorant truncate mb-1">{detail.name}</h4>
                              </div>
                              {/* RATING CẠNH NAME */}
                              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg flex-shrink-0">
                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold text-amber-700">{detail.ratingStats?.averageRating || 5.0}</span>
                              </div>
                            </div>

                            <p title={detail.address} className="text-xs text-gray-400 flex items-center gap-1 truncate mb-2"><MapPin size={12} /> {getCleanAddress(detail.address)}</p>
                            <div title={detail.description} className={`p-3 rounded-xl border border-dashed text-xs italic leading-relaxed line-clamp-2 ${isRestaurant ? "bg-orange-50/30 border-orange-100" : "bg-teal-50/30 border-teal-100"}`}>
                              “{detail.description}”
                            </div>
                          </div>

                          <div className="pt-4 mt-3 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Chi phí dự tính</span>
                              <span className="text-lg font-black text-[#004D40]">{formatCurrency(detail.finalPrice || detail.pricePerUnit)}đ</span>
                            </div>
                            <div className={`flex items-center gap-2 px-5 py-2 text-[11px] font-bold transition-all rounded-tr-[15px] rounded-bl-[15px] rounded-tl-sm rounded-br-sm ${isRestaurant ? "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white" : "bg-teal-50 text-[#004D40] group-hover:bg-[#004D40] group-hover:text-white"}`}>
                              Xem chi tiết <ExternalLink size={14} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TripPreview;