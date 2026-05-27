import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import AIInsights from "../../components/owner/AIInsights";
import DashboardCharts from "../../components/owner/DashboardCharts";
import TopPerformingServices from "../../components/owner/TopPerformingServices";

const Dashboard = () => {
  const { getToken } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [allOwnerServices, setAllOwnerServices] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const rawBookings = bookingsRes.data.data?.bookings || [];
        const validBookings = rawBookings.filter(
          (b) => b.status !== "PENDING" && b.status !== "EXPIRED",
        );
        setBookings(validBookings);
      }

      if (servicesRes.data?.success) {
        const allServices = servicesRes.data.data || [];
        setAllOwnerServices(allServices);
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

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#004D40] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-[#004D40]/70 uppercase tracking-widest animate-pulse">
          Đang khởi tạo trung tâm điều hành...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-jakarta pb-12">
      <div>
        <h1 className="text-3xl font-cormorant font-bold text-[#004D40]">
          Trung tâm điều hành kinh doanh
        </h1>
        <p className="text-xs font-semibold text-gray-400 mt-1">
          Báo cáo dữ liệu hoạt động tự động thông minh tính đến chu kỳ năm 2026.
        </p>
      </div>
      
      {/* 1. Trợ lý AI đọc dữ liệu đưa lên hàng đầu */}
      <AIInsights bookings={bookings} services={allOwnerServices} />

      {/* 2. Phân vùng đồ thị Recharts (Cột doanh thu & Tròn cơ cấu) */}
      <DashboardCharts bookings={bookings} />

      {/* 3. Bảng xếp hạng đôi: Gà đẻ trứng vàng & Ngôi sao uy tín */}
      <TopPerformingServices bookings={bookings} services={allOwnerServices} />
    </div>
  );
};

export default Dashboard;