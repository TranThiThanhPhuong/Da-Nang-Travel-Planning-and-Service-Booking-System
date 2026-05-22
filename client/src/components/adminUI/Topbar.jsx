import React, { useState } from "react";
import { BellDot, CreditCard, UserPlus, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, useUser } from "@clerk/clerk-react"; // Giữ lại nếu dùng Clerk, nếu không dùng hãy comment lại

const Topbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useUser(); // Lấy thông tin user từ Clerk

  const notifications = [
    {
      id: 1,
      title: "Owner chuyển tiền thành công",
      desc: "Gói VIP - VNPay: #VN88291",
      time: "2 phút trước",
      icon: <CreditCard size={16} className="text-[#004D40]" />,
      bg: "bg-[#E0F2F1]",
    },
    {
      id: 2,
      title: "Yêu cầu đăng ký Owner mới",
      desc: "Từ người dùng: Nguyễn Văn A",
      time: "1 giờ trước",
      icon: <UserPlus size={16} className="text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      id: 3,
      title: "Dịch vụ mới chờ duyệt",
      desc: "Khách sạn Sunview vừa đăng tải",
      time: "3 giờ trước",
      icon: <CheckCircle2 size={16} className="text-[#FFAB40]" />,
      bg: "bg-[#FFAB40]/10",
    },
  ];

  return (
    <header className="h-16 bg-[#F5F5F5]/80 backdrop-blur-[10px] border-b border-white flex items-center justify-between px-6 md:px-8 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.02)] font-jakarta sticky top-0">
      {/* Bên trái: Title */}
      <div>
        <h2 className="text-lg font-extrabold text-[#004D40] tracking-tight">
          Quản lý hệ thống
        </h2>
      </div>

      {/* Bên phải: Actions */}
      <div className="flex items-center gap-5">
        <Link
          to="/"
          className="text-sm font-bold text-gray-500 hover:text-[#FFAB40] transition-colors"
        >Trang khách hàng
        </Link>

        {/* Notifications Dropdown Container */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl transition-all duration-200 relative ${
              showNotifications
                ? "bg-[#004D40] text-white shadow-lg shadow-[#004D40]/20"
                : "text-[#004D40] hover:bg-[#E0F2F1]"
            }`}
          >
            <BellDot size={22} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FFAB40] rounded-full border-2 border-[#F5F5F5]"></span>
          </motion.button>

          {/* Notification Box */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-[-1]"
                  onClick={() => setShowNotifications(false)}
                ></div>

                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden origin-top-right z-50"
                >
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-[#004D40]">Thông báo</h3>
                    <span className="text-[10px] bg-[#004D40] text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                      3 Mới
                    </span>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-[#E0F2F1]/30 transition cursor-pointer border-b border-gray-50 last:border-0 group"
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800 line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {item.desc}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">
                              {item.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-gray-50 text-center">
                    <button className="text-xs text-[#004D40] hover:text-[#FFAB40] font-bold transition">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200"></div>

        {/* User Profile - Không dùng dropdown tay, dùng UserButton của Clerk */}
        <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-[#004D40] leading-none">Admin</p>
                <p className="text-[10px] text-gray-400 mt-1">{user?.firstName || 'D-Pulse'}</p>
            </div>
            <div className="p-0.5 border-2 border-[#E0F2F1] rounded-full hover:border-[#004D40] transition-colors">
                <UserButton afterSignOutUrl="/" />
            </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;