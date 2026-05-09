import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Loader2,
  Calendar,
  DollarSign,
  Users,
  Heart,
  Compass,
  Mountain,
  Home,
  MapPin,
  Check,
} from 'lucide-react';
import TripPreview from '../components/TripPreview';

const AITripPlanner = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState(null);

  const [formData, setFormData] = useState({
    destination: '',
    days: '',
    startDate: '',
    budget: '',
    travelStyle: 'EXPLORATION',
    preferences: '',
    peopleCount: '1',
  });

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: `Chào ${user?.firstName || 'bạn'}! 👋 Mình là D-PULSE AI - trợ lý du lịch thông minh. Hãy cho mình biết bạn muốn đi đâu nhé?`,
    },
  ]);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const travelStyles = [
    { value: 'RELAXATION', label: 'Nghỉ dưỡng', icon: Home },
    { value: 'EXPLORATION', label: 'Khám phá', icon: Compass },
    { value: 'FAMILY', label: 'Gia đình', icon: Users },
    { value: 'COUPLE', label: 'Cặp đôi', icon: Heart },
    { value: 'ADVENTURE', label: 'Phiêu lưu', icon: Mountain },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateTrip = async () => {
    if (!formData.destination || !formData.days || !formData.startDate) {
      alert('Vui lòng điền đầy đủ thông tin cơ bản');
      return;
    }

    setLoading(true);
    addMessage('ai', 'Đang phân tích và tạo lịch trình cho bạn... ✨');

    try {
      const token = await getToken();
      const response = await axios.post('/api/trips/generate', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setGeneratedTrip(response.data.data);
        addMessage(
          'ai',
          `Hoàn thành! Mình đã tạo lịch trình "${response.data.data.title}" cho bạn. Hãy xem bên phải nhé! 🎉`
        );
      }
    } catch (error) {
      console.error('Generate trip error:', error);
      addMessage(
        'ai',
        'Xin lỗi, có lỗi xảy ra khi tạo lịch trình. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { id: Date.now(), role, text }]);
  };

  const handleSaveTrip = async () => {
    alert('✅ Lịch trình đã được lưu vào "Lịch trình của tôi"');
    navigate('/my-itineraries');
  };

  const inputStyle =
    'w-full px-4 py-3 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-bold text-[#004D40] placeholder-[#004D40]/40 transition-all';

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-20 flex flex-col lg:flex-row overflow-hidden font-jakarta">
      {/* LEFT: CHAT */}
      <div className="w-full lg:w-[450px] bg-white border-r border-[#004D40]/5 flex flex-col shadow-2xl">
        {/* HEADER */}
        <div className="p-6 border-b border-[#004D40]/5 bg-gradient-to-r from-[#004D40] to-[#00665A] text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFAB40] rounded-tr-xl rounded-bl-xl flex items-center justify-center shadow-lg">
              <Sparkles size={24} className="text-[#004D40]" />
            </div>
            <div>
              <h2 className="font-cormorant font-bold text-2xl">D-PULSE AI</h2>
              <p className="text-[10px] font-bold text-[#FFAB40] uppercase tracking-widest">
                Trợ lý du lịch thông minh
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 shadow-sm text-sm font-medium leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#004D40] text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm'
                      : 'bg-[#E0F2F1] text-[#004D40] rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* FORM */}
        <div className="p-6 bg-white border-t border-[#004D40]/5 space-y-4">
          {/* DESTINATION */}
          <div>
            <label className="block text-xs font-bold text-[#004D40] mb-2 flex items-center gap-1">
              <MapPin size={14} className="text-[#FFAB40]" />
              Điểm đến
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              placeholder="VD: Đà Nẵng"
              className={inputStyle}
            />
          </div>

          {/* DAYS & START DATE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#004D40] mb-2 flex items-center gap-1">
                <Calendar size={14} className="text-[#FFAB40]" />
                Số ngày
              </label>
              <input
                type="number"
                value={formData.days}
                onChange={(e) => handleInputChange('days', e.target.value)}
                min="1"
                max="30"
                placeholder="3"
                className={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#004D40] mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={inputStyle}
              />
            </div>
          </div>

          {/* BUDGET */}
          <div>
            <label className="block text-xs font-bold text-[#004D40] mb-2 flex items-center gap-1">
              <DollarSign size={14} className="text-[#FFAB40]" />
              Ngân sách (VNĐ)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              placeholder="5000000"
              className={inputStyle}
            />
          </div>

          {/* TRAVEL STYLE */}
          <div>
            <label className="block text-xs font-bold text-[#004D40] mb-2">
              Phong cách du lịch
            </label>
            <div className="grid grid-cols-3 gap-2">
              {travelStyles.map((style) => {
                const Icon = style.icon;
                return (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => handleInputChange('travelStyle', style.value)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      formData.travelStyle === style.value
                        ? 'border-[#004D40] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-[#FFAB40]'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        formData.travelStyle === style.value
                          ? 'text-[#004D40]'
                          : 'text-gray-400'
                      }
                    />
                    <span
                      className={`text-[10px] font-bold ${
                        formData.travelStyle === style.value
                          ? 'text-[#004D40]'
                          : 'text-gray-500'
                      }`}
                    >
                      {style.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PEOPLE COUNT */}
          <div>
            <label className="block text-xs font-bold text-[#004D40] mb-2 flex items-center gap-1">
              <Users size={14} className="text-[#FFAB40]" />
              Số người
            </label>
            <input
              type="number"
              value={formData.peopleCount}
              onChange={(e) => handleInputChange('peopleCount', e.target.value)}
              min="1"
              max="20"
              placeholder="1"
              className={inputStyle}
            />
          </div>

          {/* PREFERENCES */}
          <div>
            <label className="block text-xs font-bold text-[#004D40] mb-2">
              Sở thích / Yêu cầu đặc biệt
            </label>
            <textarea
              value={formData.preferences}
              onChange={(e) => handleInputChange('preferences', e.target.value)}
              placeholder="VD: Thích ăn hải sản, muốn xem hoàng hôn..."
              rows="2"
              className={`${inputStyle} resize-none`}
            />
          </div>

          {/* GENERATE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateTrip}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#004D40] to-[#00665A] text-white py-4 rounded-tr-2xl rounded-bl-2xl rounded-tl-lg rounded-br-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
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

      {/* RIGHT: PREVIEW */}
      <div className="flex-1 bg-[#F5F5F5] relative overflow-y-auto">
        {generatedTrip ? (
          <TripPreview trip={generatedTrip} onSave={handleSaveTrip} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-md"
            >
              <div className="w-24 h-24 bg-[#E0F2F1] rounded-tr-[40px] rounded-bl-[40px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Compass size={40} className="text-[#004D40]" />
              </div>
              <h3 className="font-cormorant text-3xl font-bold text-[#004D40] mb-4">
                Sẵn sàng kiến tạo hành trình
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Điền thông tin bên trái và nhấn "Tạo lịch trình AI". Lịch trình
                chi tiết sẽ xuất hiện tại đây.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITripPlanner;