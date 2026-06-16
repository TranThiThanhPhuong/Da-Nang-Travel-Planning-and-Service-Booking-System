import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "../../hooks/axios";
import { Lock } from "lucide-react";
import AIInsights from "../../components/owner/AIInsights";
import DashboardCharts from "../../components/owner/DashboardCharts";
import TopPerformingServices from "../../components/owner/TopPerformingServices";

const Dashboard = () => {
  const { getToken } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [allOwnerServices, setAllOwnerServices] = useState([]);
  const [saasStatus, setSaasStatus] = useState({ currentPackage: "STARTER" });
  const [loading, setLoading] = useState(true);

  const systemSynchronization = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [bookingsRes, servicesRes, saasRes] = await Promise.all([
        axios.get("/api/bookings/service-bookings", config),
        axios.get("/api/services/my", config),
        axios.get("/api/owner/saas/status", config)
      ]);

      if (saasRes.data?.success) {
        setSaasStatus(saasRes.data.data);
      }

      const currentPkg = saasRes.data?.data?.currentPackage || "STARTER";

      // 🛑 KHÓA GÓI STARTER: Không lưu dữ liệu vào state để truyền xuống các component dưới
      if (currentPkg !== "STARTER") {
        if (bookingsRes.data?.success) {
          const rawBookings = bookingsRes.data.data?.bookings || [];
          const validBookings = rawBookings.filter(
            (b) => b.status !== "PENDING" && b.status !== "EXPIRED"
          );
          setBookings(validBookings);
        }

        if (servicesRes.data?.success) {
          const allServices = servicesRes.data.data || [];
          setAllOwnerServices(allServices);
        }
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

  const currentPackage = saasStatus?.currentPackage || "STARTER";

  const PaywallOverlay = ({ title }) => (
    <div className="absolute inset-0 bg-white/40 backdrop-blur-[6px] z-10 flex flex-col items-center justify-center p-6 text-center rounded-2xl">
      <div className="p-3 bg-[#004D40] text-white rounded-2xl shadow-md mb-3">
        <Lock size={20} />
      </div>
      <h4 className="text-xs font-black text-[#004D40] uppercase tracking-wider mb-1">
        Tính năng này bị khóa
      </h4>
      <p className="text-[10px] font-bold text-gray-500 max-w-xs leading-relaxed">
        Vui lòng nâng cấp lên hạn mức gói cao hơn để mở khóa phân hệ {title}.
      </p>
    </div>
  );

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

      {/* 1. Phân vùng AI Insights (Yêu cầu duy nhất ULTIMATE) */}
      <div className="relative w-full">
        <AIInsights 
          bookings={currentPackage === "ULTIMATE" ? bookings : []} 
          services={currentPackage === "ULTIMATE" ? allOwnerServices : []} 
        />
        {currentPackage !== "ULTIMATE" && <PaywallOverlay title="Trợ lý chiến lược AI Gemini" />}
      </div>

      {/* 2. Phân vùng Đồ thị & Cơ cấu Doanh thu (Yêu cầu PRO hoặc ULTIMATE) */}
      <div className="relative w-full">
        <DashboardCharts bookings={currentPackage !== "STARTER" ? bookings : []} />
        {currentPackage === "STARTER" && <PaywallOverlay title="Biểu đồ phân tích doanh thu" />}
      </div>

      {/* 3. Bảng xếp hạng Dịch vụ (Yêu cầu PRO hoặc ULTIMATE) */}
      <div className="relative w-full">
        <TopPerformingServices 
          bookings={currentPackage !== "STARTER" ? bookings : []} 
          services={currentPackage !== "STARTER" ? allOwnerServices : []} 
        />
        {currentPackage === "STARTER" && <PaywallOverlay title="Bảng xếp hạng hiệu suất kinh doanh" />}
      </div>
    </div>
  );
};

export default Dashboard;