import React from 'react';
import { motion } from 'framer-motion';

const InventoryCalendar = ({ year, month, inventory, onDayClick, serviceType }) => {
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  const calendarDays = [];
  
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getInventoryForDay = (day) => {
    const targetDate = new Date(year, month - 1, day);
    targetDate.setHours(0, 0, 0, 0);
    return inventory.find((inv) => {
      const invDate = new Date(inv.date);
      invDate.setHours(0, 0, 0, 0);
      return invDate.getTime() === targetDate.getTime();
    });
  };

  const getDayColor = (inv) => {
    if (!inv) return 'bg-gray-100 border-gray-200 text-gray-400';

    switch (inv.status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
      case 'LIMITED':
        return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
      case 'SOLD_OUT':
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-600';
    }
  };

  const isPastDay = (day) => {
    if (!isCurrentMonth) {
      return new Date(year, month - 1) < new Date(today.getFullYear(), today.getMonth());
    }
    return day < today.getDate();
  };

  const getServiceLabel = () => {
    switch (serviceType) {
      case 'HOTEL':
        return 'phòng';
      case 'RESTAURANT':
        return 'bàn';
      case 'ACTIVITY':
        return 'vé';
      default:
        return 'chỗ';
    }
  };

  return (
    <div>
      {/* WEEKDAY HEADERS */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
          <div
            key={idx}
            className="text-center py-2 text-xs font-bold text-[#004D40] uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const inv = getInventoryForDay(day);
          const isPast = isPastDay(day);
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <motion.button
              key={day}
              whileHover={{ scale: isPast ? 1 : 1.05 }}
              whileTap={{ scale: isPast ? 1 : 0.95 }}
              onClick={() => !isPast && onDayClick({ day, inventory: inv, date: new Date(year, month - 1, day) })}
              disabled={isPast}
              className={`
                aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center
                transition-all cursor-pointer relative overflow-hidden
                ${getDayColor(inv)}
                ${isPast ? 'opacity-40 cursor-not-allowed' : ''}
                ${isToday ? 'ring-2 ring-[#004D40] ring-offset-2' : ''}
              `}
              title={
                inv
                  ? `${inv.totalSlots} ${getServiceLabel()} | Đã đặt: ${inv.bookedSlots} | Còn: ${inv.availableSlots}`
                  : 'Chưa cập nhật'
              }
            >
              {/* DAY NUMBER */}
              <span className="text-lg font-bold mb-1">{day}</span>

              {/* INVENTORY INFO */}
              {inv ? (
                <div className="text-[12px] font-bold text-center leading-tight">
                  <div>{inv.availableSlots}/{inv.totalSlots}</div>
                </div>
              ) : (
                <div className="text-[9px] font-medium opacity-60">Trống</div>
              )}

              {/* TODAY INDICATOR */}
              {isToday && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-[#004D40] rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryCalendar;