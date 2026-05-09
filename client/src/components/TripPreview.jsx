import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, MapPin, Clock, Save, ExternalLink } from 'lucide-react';

const TripPreview = ({ trip, onSave }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl p-8 shadow-lg border border-white/60 mb-6"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-cormorant font-bold text-[#004D40] mb-2">
              {trip.title}
            </h1>
            <p className="text-gray-600 font-medium">{trip.summary}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSave}
            className="flex items-center gap-2 bg-[#004D40] text-white px-6 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md font-bold shadow-lg"
          >
            <Save size={18} />
            Lưu lịch trình
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E0F2F1] rounded-lg flex items-center justify-center">
              <Calendar className="text-[#004D40]" size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Thời gian</div>
              <div className="text-sm font-bold text-[#004D40]">
                {trip.days} ngày
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E0F2F1] rounded-lg flex items-center justify-center">
              <DollarSign className="text-[#004D40]" size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Dự toán</div>
              <div className="text-sm font-bold text-[#004D40]">
                {formatCurrency(trip.estimatedBudget)} đ
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E0F2F1] rounded-lg flex items-center justify-center">
              <MapPin className="text-[#004D40]" size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Điểm đến</div>
              <div className="text-sm font-bold text-[#004D40]">
                {trip.destination}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ITINERARY */}
      <div className="space-y-6">
        {trip.itinerary.map((day, dayIndex) => (
          <motion.div
            key={day.dayNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.1 }}
            className="bg-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl p-6 shadow-lg border border-white/60"
          >
            {/* DAY HEADER */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#004D40]/10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004D40] to-[#00665A] text-white rounded-tr-xl rounded-bl-xl flex items-center justify-center font-bold text-lg">
                {day.dayNumber}
              </div>
              <div>
                <h3 className="font-cormorant text-2xl font-bold text-[#004D40]">
                  Ngày {day.dayNumber}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {formatDate(day.date)}
                </p>
              </div>
            </div>

            {/* ACTIVITIES */}
            <div className="space-y-4">
              {day.activities.map((activity, actIndex) => (
                <div
                  key={actIndex}
                  className="flex gap-4 p-4 bg-[#F5F5F5] rounded-tr-2xl rounded-bl-2xl rounded-tl-lg rounded-br-lg border border-[#E0F2F1] hover:border-[#FFAB40] transition-all"
                >
                  {/* TIME */}
                  <div className="flex items-start gap-2 min-w-[80px]">
                    <Clock className="text-[#FFAB40] mt-0.5" size={16} />
                    <span className="text-sm font-bold text-[#004D40]">
                      {activity.time}
                    </span>
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1">
                    <h4 className="font-bold text-[#004D40] mb-1">
                      {activity.activityName}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                      <MapPin size={12} />
                      {activity.address}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {activity.description}
                    </p>

                    {/* SERVICE LINK */}
                    {activity.serviceId && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="px-3 py-1 bg-[#E0F2F1] rounded-full text-xs font-bold text-[#004D40]">
                          Dịch vụ D-PULSE
                        </div>
                        <button className="text-xs text-[#FFAB40] font-bold flex items-center gap-1 hover:underline">
                          Xem chi tiết <ExternalLink size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TripPreview;