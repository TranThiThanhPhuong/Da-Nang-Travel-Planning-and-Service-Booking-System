import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Medal, ShoppingBag, Star, Award, TrendingUp } from "lucide-react";

const TopPerformingServices = ({ bookings = [], services = [] }) => {
  const topRevenueServices = useMemo(() => {
    const revenueMap = {};

    // Chỉ lọc các đơn hàng đã thực sự khép lại dòng tiền: COMPLETED hoặc CANCELLED
    const closedBookings = bookings.filter(
      (b) => b.status === "COMPLETED" || b.status === "CANCELLED"
    );

    closedBookings.forEach((b) => {
      const sId = b.serviceId?._id || b.serviceId;
      if (!sId) return;

      if (!revenueMap[sId]) {
        revenueMap[sId] = {
          _id: sId,
          name: b.serviceId?.name || "Dịch vụ hệ thống",
          type: b.serviceId?.type || "HOTEL",
          thumbnail: b.serviceId?.thumbnail || "",
          count: 0, // Tổng số lượng (phòng/suất/vé) đã tiêu thụ thành công
          revenue: 0, // Tổng dòng tiền thực tế Owner nhận được
        };
      }

      // Cộng dồn quy mô tiêu thụ dựa vào quantity trong bookingDetails
      revenueMap[sId].count += b.bookingDetails?.quantity || 0;

      // Tính dòng tiền thực tế thu về của Owner
      if (b.status === "COMPLETED") {
        // Đơn hoàn thành: Ăn trọn 100% giá trị đơn hàng sau giảm giá
        revenueMap[sId].revenue += b.bookingDetails?.totalPrice || 0;
      } else if (b.status === "CANCELLED") {
        // Đơn bị hủy: Chỉ tính phần tiền phạt giữ lại cho Owner (nếu có)
        revenueMap[sId].revenue += b.cancellationDetails?.penaltyAmount || 0;
      }
    });

    // Chuyển đổi object thành mảng, sắp xếp giảm dần theo doanh thu thu về và lấy Top 3
    return Object.values(revenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  }, [bookings]);

  const topRatedServices = useMemo(() => {
    // Lấy trực tiếp từ mảng danh sách dịch vụ của Owner (Bao gồm cả Hotel, Restaurant, Activity)
    return [...services]
      .filter((s) => s.approvalStatus === "APPROVED" && s.ratingStats?.totalReviews > 0)
      // Ưu tiên sắp xếp theo số sao trung bình, nếu bằng sao thì ưu tiên sản phẩm có nhiều lượt review hơn
      .sort((a, b) => {
        if (b.ratingStats.averageRating === a.ratingStats.averageRating) {
          return b.ratingStats.totalReviews - a.ratingStats.totalReviews;
        }
        return b.ratingStats.averageRating - a.ratingStats.averageRating;
      })
      .slice(0, 3);
  }, [services]);

  // 🛠️ HÀM TRỢ GIÚP: Tự động đổi đơn vị đo lường theo loại hình dịch vụ đặc trưng
  const getUnitLabel = (type) => {
    switch (type) {
      case "HOTEL":
        return "phòng";
      case "RESTAURANT":
        return "suất ăn";
      case "ACTIVITY":
        return "vé";
      default:
        return "lượt";
    }
  };

  const getServiceTypeBadge = (type) => {
    const config = {
      HOTEL: "bg-teal-50 text-teal-700 border-teal-100",
      RESTAURANT: "bg-amber-50 text-amber-700 border-amber-100",
      ACTIVITY: "bg-sky-50 text-sky-700 border-sky-100",
    };
    return config[type] || "bg-gray-50 text-gray-700";
  };

  const getRankBadgeColor = (index) => {
    if (index === 0) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (index === 1) return "text-slate-500 bg-slate-50 border-slate-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      
      {/* 💰 BẢNG CỘT TRÁI: DOANH THU CHỐT SỔ (HỢP NHẤT 3 NGÀNH) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-tr-[32px] rounded-bl-[32px] rounded-tl-xl rounded-br-xl border border-[#004D40]/10 shadow-sm flex flex-col justify-between"
      >
        <div>
          <h3 className="text-sm font-black text-[#004D40] uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#FFAB40]" /> Top sản phẩm doanh thu cao nhất
          </h3>
          <p className="text-[11px] font-medium text-gray-400 mb-6">
            Dòng tiền thực tế tích lũy từ các đơn đã <strong className="text-emerald-700">Hoàn thành</strong> và tiền phạt từ đơn <strong className="text-red-600">Đã hủy</strong>.
          </p>

          <div className="space-y-4">
            {topRevenueServices.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 py-8 text-center italic">Chưa có dữ liệu doanh thu chốt sổ chu kỳ này.</p>
            ) : (
              topRevenueServices.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between p-3.5 bg-[#F5F5F5]/60 hover:bg-[#E0F2F1]/30 border border-gray-100 rounded-xl transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg border font-black text-xs flex items-center justify-center shrink-0 ${getRankBadgeColor(index)}`}>
                      {index + 1}
                    </div>
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.name} className="w-11 h-11 rounded-lg object-cover border border-white shadow-sm shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h5 className="text-xs font-extrabold text-[#004D40] truncate pr-2">{item.name}</h5>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-bold">
                        <span className="flex items-center gap-0.5 text-[#004D40]/60">
                          <ShoppingBag size={11} /> Đã bán {item.count} {getUnitLabel(item.type)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider border ${getServiceTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-black tracking-widest uppercase text-gray-400 block">Thực thu</span>
                    <span className="text-xs font-black text-[#FFAB40] mt-0.5 block">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* ⭐️ BẢNG CỘT PHẢI: NGÔI SAO UY TÍN (HOTEL / RESTAURANT / ACTIVITY) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-tl-[32px] rounded-br-[32px] rounded-tr-xl rounded-bl-xl border border-[#004D40]/10 shadow-sm flex flex-col justify-between"
      >
        <div>
          <h3 className="text-sm font-black text-[#004D40] uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <Award size={16} className="text-[#004D40]" /> Top sản phẩm đánh giá tốt nhất
          </h3>
          <p className="text-[11px] font-medium text-gray-400 mb-6">
            Xếp hạng chất lượng dịch vụ của chuỗi Khách sạn, Nhà hàng và Hoạt động giải trí.
          </p>

          <div className="space-y-4">
            {topRatedServices.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 py-8 text-center italic">Chưa có phản hồi hoặc đánh giá sao từ khách hàng.</p>
            ) : (
              topRatedServices.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between p-3.5 bg-[#F5F5F5]/60 hover:bg-[#E0F2F1]/30 border border-gray-100 rounded-xl transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg border font-black text-xs flex items-center justify-center shrink-0 ${getRankBadgeColor(index)}`}>
                      {index + 1}
                    </div>
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.name} className="w-11 h-11 rounded-lg object-cover border border-white shadow-sm shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h5 className="text-xs font-extrabold text-[#004D40] truncate pr-2">{item.name}</h5>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-bold">
                        <span className="flex items-center gap-0.5 text-gray-500 font-medium">
                          ({item.ratingStats?.totalReviews || 0} đánh giá)
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider border ${getServiceTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-black tracking-widest uppercase text-gray-400 block">Điểm số</span>
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <Star size={13} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-black text-[#004D40]">{item.ratingStats?.averageRating?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default TopPerformingServices;