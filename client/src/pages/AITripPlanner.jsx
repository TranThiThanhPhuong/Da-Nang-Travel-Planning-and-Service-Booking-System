import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Calendar,
  DollarSign,
  Users,
  Heart,
  Compass,
  Mountain,
  Home,
} from "lucide-react";
import TripPreview from "./TripPreview";
import { FEATURES_CONFIG } from "../assets/featuresTrip.js";

const AITripPlanner = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const chatEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState(null);

  const [formData, setFormData] = useState({
    days: "",
    startDate: "",
    budget: "",
    travelStyle: [],
    peopleCount: "",
  });

  const [aiStatus, setAiStatus] = useState(`Chào ${user?.firstName || "bạn"} 👋 Mình là D-PULSE AI. Hãy điền thông tin để bắt đầu nhé!`);

  useEffect(() => {
    const savedForm = localStorage.getItem("lastFormData");
    if (savedForm) setFormData(JSON.parse(savedForm));
    
  }, []);
  
  useEffect(() => {
    localStorage.setItem("lastFormData", JSON.stringify(formData));
  }, [formData]);

  const addMessage = (role, text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role,
        text,
      },
    ]);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleSingleTag = (groupItems, value) => {
    setFormData((prev) => {
      const groupValues = groupItems.map((item) => item.value);
      const isAlreadySelected = prev.travelStyle.includes(value);
      const filteredStyles = prev.travelStyle.filter((tag) => !groupValues.includes(tag));
      return { ...prev, travelStyle: isAlreadySelected ? filteredStyles : [...filteredStyles, value], };
    });
  };

  const toggleMultiTag = (value) => {
    setFormData((prev) => {
      const currentStyles = prev.travelStyle;
      return {
        ...prev,
        travelStyle: currentStyles.includes(value)
          ? currentStyles.filter((t) => t !== value)
          : [...currentStyles, value],
      };
    });
  };

  const formatCurrency = (value) => {
    return Number(value).toLocaleString("vi-VN");
  };

  const handleGenerateTrip = async () => {
    if (!formData.days || !formData.startDate) {
      alert("Vui lòng nhập số ngày và ngày bắt đầu");
      return;
    }
    setLoading(true);
    setAiStatus("✨ Đang phân tích yêu cầu và lên lịch trình tối ưu cho bạn...");
    try {
      const token = await getToken();
      const response = await axios.post("/api/trips/generate", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setGeneratedTrip(response.data.data);
        setAiStatus("🎉 Hoàn thành! Lịch trình của bạn đã sẵn sàng ở bên phải.");
      }
    } catch (error) {
      setAiStatus("❌ Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!generatedTrip) {
      return;
    }
    try { 
      setLoading(true);
      setAiStatus("💾 Đang lưu lịch trình...");
      const token = await getToken();
      const response = await axios.put(
        `/api/trips/${generatedTrip._id}/advance-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data.success) {
        setAiStatus("✅ Lịch trình đã được lưu thành công");
        localStorage.removeItem("lastFormData");
        navigate("/account?tab=itineraries");
      }
    } catch (error) {
      console.error("❌ Lỗi khi lưu lịch trình:", error);
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra trong quá trình lưu lịch trình.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!generatedTrip || !generatedTrip._id) {
      alert("Không thể xóa - lịch trình chưa được tạo");
      return;
    }
    if (!confirm("Bạn có chắc muốn bỏ lịch trình này?")) return;
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.delete(`/api/trips/${generatedTrip._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        alert("✅ Đã xóa lịch trình");
        setGeneratedTrip(null);
        setAiStatus(`Chào ${user?.firstName || "bạn"} 👋 Mình là D-PULSE AI. Hãy điền thông tin để bắt đầu nhé!`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full px-4 py-3 rounded-tr-xl rounded-bl-xl border border-gray-200 bg-white/80 backdrop-blur-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all text-sm font-medium text-[#004D40]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FFFD] via-white to-[#E8F7F3] pt-20 flex flex-col lg:flex-row font-jakarta overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[460px] bg-white/90 backdrop-blur-xl border-r border-gray-100 shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-[#004D40] to-[#00695C] text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-tr-xl rounded-bl-xl bg-[#FFB74D] flex items-center justify-center shadow-lg">
              <Sparkles className="text-[#004D40]" size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-cormorant">D-PULSE AI</h1>
              <p className="uppercase tracking-[4px] text-[10px] text-[#FFE0B2] font-bold">
                Smart Travel Assistant
              </p>
            </div>
          </div>
        </div>

        {/* CHAT */}
        <div className="p-5 bg-[#FAFAFA] border-b border-gray-50">
          <motion.div
            key={aiStatus} 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-tr-2xl rounded-bl-2xl border border-[#E0F2F1] shadow-sm text-sm text-[#004D40] leading-relaxed"
          >
            {aiStatus}
          </motion.div>
        </div>

        {/* FORM */}
        <div className="p-6 border-t border-gray-100 bg-white space-y-5">
          {/* DAYS + DATE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                <Calendar size={14} />
                Số ngày
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.days}
                onChange={(e) => handleInputChange("days", e.target.value)}
                placeholder="≤ 7 ngày"
                className={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-2 block">
                Ngày đi
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={inputStyle}
              />
            </div>
          </div>

          {/* BUDGET */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-1 text-xs font-bold text-[#004D40]">
                <DollarSign size={14} />
                Ngân sách <p class="">(có thể bỏ qua)</p>
              </label>
              <span className="rounded-full bg-[#E0F2F1] px-3 py-1 text-xs font-bold text-[#004D40]">
                {formatCurrency(formData.budget)} VNĐ
              </span>
            </div>
            <input
              type="range"
              min="500000"
              max="50000000"
              step="100000"
              value={formData.budget}
              onChange={(e) => handleInputChange("budget", e.target.value)}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E0F2F1]"
            />
            <div className="mt-2 flex justify-between text-[11px] text-gray-500">
              <span>500K</span>
              <span>50M</span>
            </div>
          </div>

          {/* PEOPLE */}
          <div>
            <label className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
              <Users size={14} />
              Số người
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.peopleCount}
              onChange={(e) => handleInputChange("peopleCount", e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* STYLE SELECTION */}
          <div className="space-y-8 py-4">
            {/* NHÓM KHÁCH SẠN - CHỌN ĐƠN (SINGLE) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#004D40] flex items-center gap-2 border-l-4 border-[#FFB74D] pl-3">
                Lưu trú (Chọn 1 cho mỗi mục)
              </h3>
              <div className="space-y-5 pl-4">
                {FEATURES_CONFIG.HOTEL.map((group, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {group.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const isActive = formData.travelStyle.includes(
                          item.value,
                        );
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                              toggleSingleTag(group.items, item.value)
                            }
                            className={`px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all border ${
                              isActive
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NHÓM ĂN UỐNG - CHỌN NHIỀU (MULTI) */}
            <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
              <h3 className="text-sm font-bold text-[#004D40] flex items-center gap-2 border-l-4 border-[#FFB74D] pl-3">
                Âm thực (Có thể chọn nhiều)
              </h3>
              <div className="space-y-5 pl-4">
                {FEATURES_CONFIG.RESTAURANT.map((group, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const isActive = formData.travelStyle.includes(
                          item.value,
                        );
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => toggleMultiTag(item.value)}
                            className={`px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all border ${
                              isActive
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"
                            }`}
                          >
                            {isActive && "✓ "} {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NHÓM HOẠT ĐỘNG - CHỌN NHIỀU (MULTI) */}
            <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
              <h3 className="text-sm font-bold text-[#004D40] flex items-center gap-2 border-l-4 border-[#FFB74D] pl-3">
                Trải nghiệm & Hoạt động (Có thể chọn nhiều)
              </h3>
              <div className="space-y-5 pl-4">
                {FEATURES_CONFIG.ACTIVITY.map((group, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const isActive = formData.travelStyle.includes(
                          item.value,
                        );
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => toggleMultiTag(item.value)}
                            className={`px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all border ${
                              isActive
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"
                            }`}
                          >
                            {isActive && "✓ "} {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BUTTON */}
          <motion.button
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={handleGenerateTrip}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#004D40] to-[#00796B] text-white py-4 rounded-tr-3xl rounded-bl-3xl font-bold shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Đang tạo lịch trình...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Tạo lịch trình AI
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto bg-[#F7FAF9]">
        {generatedTrip ? (
          <TripPreview trip={generatedTrip} onSave={handleSaveTrip} onCancel={handleCancel}/>
        ) : (
          <div className="h-full flex items-center justify-center p-10">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="text-center max-w-lg"
            >
              <div className="w-32 h-32 mx-auto rounded-[40px] bg-gradient-to-br from-[#E0F2F1] to-white flex items-center justify-center shadow-inner mb-8">
                <Compass size={52} className="text-[#004D40]" />
              </div>
              <h2 className="text-4xl font-bold font-cormorant text-[#004D40] mb-4">
                Hành trình của bạn sẽ xuất hiện tại đây
              </h2>
              <p className="text-gray-500 leading-relaxed">
                Điền thông tin bên trái và để AI giúp bạn tạo một chuyến đi hoàn
                hảo ✨
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITripPlanner;