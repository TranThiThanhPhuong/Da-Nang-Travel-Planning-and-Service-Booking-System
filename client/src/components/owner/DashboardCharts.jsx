import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, PieChart as PieIcon, CalendarDays } from "lucide-react";

const DashboardCharts = ({ bookings = [] }) => {
  // 1. Tự động tìm ra danh sách các năm có trong dữ liệu Bookings để làm Dropdown chọn năm
  const availableYears = useMemo(() => {
    const years = new Set();
    // Luôn thêm năm hiện tại (2026) làm mặc định nếu data thô trống
    years.add(2026); 

    bookings.forEach((b) => {
      // Ưu tiên lấy năm theo ngày thanh toán hoặc ngày hoàn thành/hủy đơn
      const dateStr = b.paymentDetails?.paidAt || b.cancellationDetails?.refundedAt || b.createdAt;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [bookings]);

  const [selectedYear, setSelectedYear] = useState(2026);

  const monthlyData = useMemo(() => {
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: `Tháng ${i + 1}`,
      "Doanh thu": 0,
    }));

    bookings.forEach((b) => {
      if (b.status !== "COMPLETED" && b.status !== "CANCELLED") return;

      const dateStr = b.paymentDetails?.paidAt || b.cancellationDetails?.refundedAt || b.createdAt;
      if (!dateStr) return;

      const bookingDate = new Date(dateStr);
      const year = bookingDate.getFullYear();
      const monthIndex = bookingDate.getMonth();

      if (year === selectedYear) {
        if (b.status === "COMPLETED" || b.status === "PAID") {
          monthlyRevenue[monthIndex]["Doanh thu"] += b.bookingDetails?.totalPrice || 0;
        } else if (b.status === "CANCELLED") {
          monthlyRevenue[monthIndex]["Doanh thu"] += b.cancellationDetails?.penaltyAmount || 0;
        }
      }
    });

    return monthlyRevenue;
  }, [bookings, selectedYear]);

  const breakdownData = useMemo(() => {
    const typeMap = {
      HOTEL: { name: "Khách sạn / Lưu trú", value: 0 },
      RESTAURANT: { name: "Nhà hàng / Ẩm thực", value: 0 },
      ACTIVITY: { name: "Tour & Hoạt động", value: 0 },
    };

    bookings.forEach((b) => {
      if (b.status !== "COMPLETED" && b.status !== "CANCELLED") return;

      const dateStr = b.paymentDetails?.paidAt || b.cancellationDetails?.refundedAt || b.createdAt;
      if (!dateStr) return;

      const bookingDate = new Date(dateStr);
      const year = bookingDate.getFullYear();

      if (year === selectedYear) {
        const sType = b.serviceId?.type || "HOTEL";
        if (typeMap[sType]) {
          if (b.status === "COMPLETED" || b.status === "PAID") {
            typeMap[sType].value += b.bookingDetails?.totalPrice || 0;
          } else if (b.status === "CANCELLED") {
            typeMap[sType].value += b.cancellationDetails?.penaltyAmount || 0;
          }
        }
      }
    });

    return Object.values(typeMap).filter((item) => item.value > 0);
  }, [bookings, selectedYear]);

  const COLORS = ["#004D40", "#FFAB40", "#00BFA5"];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="space-y-6 w-full">
      {/* THANH BỘ LỌC CHỌN NĂM (THIẾT KẾ ĐẸP MẮT) */}
      <div className="flex justify-between items-center bg-white px-5 py-3 rounded-xl border border-[#004D40]/10 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-[#004D40] uppercase tracking-wider">
          <CalendarDays size={16} className="text-[#FFAB40]" /> Chu kỳ dữ liệu hiển thị
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400">Năm báo cáo:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-[#F5F5F5] border border-gray-200 text-xs font-extrabold text-[#004D40] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#004D40] cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KHÔNG GIAN BIỂU ĐỒ SONG SONG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. BIỂU ĐỒ CỘT - DOANH THU THEO TỪNG THÁNG */}
        <div className="lg:col-span-8 bg-white p-6 rounded-tr-[32px] rounded-bl-[32px] rounded-tl-xl rounded-br-xl border border-[#004D40]/10 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-[#004D40] uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <BarChart3 size={15} className="text-[#FFAB40]" /> Xu hướng doanh thu thực thu năm {selectedYear}
            </h4>
            <p className="text-[10px] font-medium text-gray-400 mb-6">
              Số liệu thống kê dòng tiền thực thu (Đơn thành công + phạt cọc) được phân bổ theo 12 chu kỳ tháng.
            </p>
          </div>
          <div className="w-full h-72 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 5, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F8F9FA" />
                <XAxis dataKey="month" stroke="#004D40" tickLine={false} />
                <YAxis 
                  stroke="#004D40" 
                  tickLine={false}
                  tickFormatter={(v) => v === 0 ? "0" : `${(v / 1e6).toFixed(0)}M`} 
                />
                <Tooltip 
                  cursor={{ fill: '#E0F2F1', opacity: 0.3 }}
                  formatter={(value) => [formatCurrency(value), "Doanh thu chốt"]} 
                />
                <Bar dataKey="Doanh thu" fill="#004D40" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => {
                    // Đổi màu cam điểm nhấn nổi bật cho tháng hiện tại (Tháng 5/2026) nếu Owner đang xem năm 2026
                    const isCurrentMonth = selectedYear === 2026 && index === new Date().getMonth();
                    return <Cell key={`cell-${index}`} fill={isCurrentMonth ? "#FFAB40" : "#004D40"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. BIỂU ĐỒ TRÒN - CƠ CẤU NGUỒN THU THEO LOẠI HÌNH DỊCH VỤ */}
        <div className="lg:col-span-4 bg-white p-6 rounded-tl-[32px] rounded-br-[32px] rounded-tr-xl rounded-bl-xl border border-[#004D40]/10 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-[#004D40] uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <PieIcon size={15} className="text-[#004D40]" /> Cơ cấu dòng tiền năm {selectedYear}
            </h4>
            <p className="text-[10px] font-medium text-gray-400 mb-4">
              Tỷ lệ phần trăm đóng góp tài chính phân loại theo mô hình dịch vụ kinh doanh.
            </p>
          </div>

          <div className="w-full h-56 text-[10px] font-black relative flex items-center justify-center">
            {breakdownData.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 italic text-center">Năm này chưa ghi nhận dòng tiền chốt sổ.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%" cy="50%" 
                    innerRadius={60} outerRadius={78} 
                    paddingAngle={4} dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* CHÚ GIẢI THÔNG SỐ CHI TIẾT DƯỚI ĐÁY BIỂU ĐỒ TRÒN */}
          <div className="space-y-2 text-[10px] font-bold text-[#004D40]/70 border-t border-gray-100 pt-4 mt-2">
            {breakdownData.length === 0 ? (
              <div className="text-center text-gray-300 font-medium">Không có danh mục hiển thị</div>
            ) : (
              breakdownData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span className="font-black text-[#004D40] shrink-0">{formatCurrency(item.value)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardCharts;