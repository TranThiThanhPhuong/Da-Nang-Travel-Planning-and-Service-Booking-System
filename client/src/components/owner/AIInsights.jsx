import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, BrainCircuit, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";

const AIInsights = ({ bookings = [], services = [] }) => {
  const { getToken } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAIInsights = async () => {
      if (bookings.length === 0 && services.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const todayStr = new Date().toISOString().split("T")[0];
        const storageKey = `ai_insights_${todayStr}`;
        const cachedData = localStorage.getItem(storageKey);

        if (cachedData) {
          setInsights(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        const token = await getToken();
        const response = await axios.post(
          "/api/trips/dashboard-insights",
          { bookings, services },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.success) {
          const aiData = response.data.data;
          setInsights(aiData);
          localStorage.setItem(storageKey, JSON.stringify(aiData));
          
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("ai_insights_") && key !== storageKey) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (error) {
        console.error("Lỗi khi kết nối trợ lý AI:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAIInsights();
  }, [bookings, services, getToken]);

  const getSignalConfig = (type) => {
    switch (type) {
      case "SUCCESS":
        return {
          bg: "bg-emerald-50/40 border-emerald-100",
          text: "text-emerald-800",
          icon: <ShieldCheck size={16} className="text-emerald-600" />,
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200"
        };
      case "WARNING":
        return {
          bg: "bg-rose-50/40 border-rose-100",
          text: "text-rose-800",
          icon: <AlertTriangle size={16} className="text-rose-600" />,
          badge: "bg-rose-100 text-rose-800 border-rose-200"
        };
      case "OPPORTUNITY":
        return {
          bg: "bg-amber-50/40 border-amber-100",
          text: "text-amber-800",
          icon: <Lightbulb size={16} className="text-amber-600" />,
          badge: "bg-amber-100 text-amber-800 border-amber-200"
        };
      default:
        return { bg: "bg-gray-50 border-gray-100", text: "text-gray-800", icon: <BrainCircuit size={16} />, badge: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-[#004D40]/5 border border-[#004D40]/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden"
          >
            <BrainCircuit size={32} className="text-[#004D40] animate-bounce" />
            <h4 className="text-xs font-black text-[#004D40] uppercase tracking-widest mt-3">
              Đang tinh chỉnh báo cáo chiến lược...
            </h4>
          </motion.div>
        ) : !insights ? (
          <div className="w-full bg-white p-6 rounded-xl border border-dashed text-center text-xs font-bold text-gray-400">
            Chưa có đủ vận đơn để tiến hành phân tích.
          </div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-tr-[32px] rounded-bl-[32px] rounded-tl-xl rounded-br-xl border border-[#004D40]/10 shadow-xs p-5 space-y-4"
          >
            {/* TIÊU ĐỀ KHU VỰC */}
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <div className="p-1.5 bg-[#004D40] text-white rounded-lg">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#004D40] uppercase tracking-wider">
                  Khuyến nghị điều hành từ Trợ lý AI
                </h3>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                  Xu hướng: <span className="text-[#FFAB40]">{insights.statusText}</span>
                </p>
              </div>
            </div>

            {/* SUMMARY TINH GỌN */}
            <p className="text-[11px] font-medium text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
              💡 {insights.executiveSummary}
            </p>

            {/* CHỈ HIỂN THỊ BẢNG BÁO CÁO NẾU CÓ CHỨA TÍN HIỆU CẢNH BÁO HOẶC CƠ HỘI ĐỘT BIẾN */}
            {insights.signals && insights.signals.length > 0 && (
              <div className="overflow-hidden border border-gray-100 rounded-xl mt-2">
                <div className="hidden md:grid grid-cols-12 bg-gray-50 p-3 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <div className="col-span-3">Phân loại / Tiêu đề</div>
                  <div className="col-span-5">Phân tích số liệu thực tế</div>
                  <div className="col-span-4">Hành động đề xuất</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {insights.signals.map((signal, index) => {
                    const config = getSignalConfig(signal.type);
                    return (
                      <div 
                        key={index} 
                        className={`grid grid-cols-1 md:grid-cols-12 p-3.5 gap-2 md:gap-4 items-start transition-colors ${config.bg}`}
                      >
                        {/* Tiêu đề & Loại */}
                        <div className="col-span-3 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${config.badge}`}>
                            {signal.type}
                          </span>
                          <h4 className={`text-xs font-black flex items-center gap-1.5 ${config.text}`}>
                            {config.icon} {signal.title}
                          </h4>
                        </div>

                        {/* Nội dung phân tích số liệu */}
                        <div className="col-span-5 text-[11px] font-medium text-gray-600 leading-relaxed">
                          <span className="md:hidden font-bold text-gray-400 block text-[9px] uppercase mb-0.5">Phân tích:</span>
                          {signal.content}
                        </div>

                        {/* Hành động khuyên dùng */}
                        <div className="col-span-4 text-[11px] font-bold text-gray-700 bg-white/60 md:bg-transparent p-2 md:p-0 rounded-lg border border-gray-200/40 md:border-transparent">
                          <span className="md:hidden font-black text-gray-400 block text-[9px] uppercase mb-1">Hành động:</span>
                          <span className={config.text}>🚀 {signal.action}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsights;