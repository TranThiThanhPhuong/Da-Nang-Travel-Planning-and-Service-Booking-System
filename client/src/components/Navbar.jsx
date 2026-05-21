import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserButton, useUser, SignInButton } from "@clerk/clerk-react";
import {
  Sparkles,
  Map,
  CalendarDays,
  ClipboardList,
  Store,
  LayoutDashboard,
  BellDot,
  CheckCircle,
  Heart,
  ReceiptText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ user: dbUser }) => {
  const { isSignedIn, isLoaded } = useUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const userRole = dbUser?.role || "USER";

  if (!isLoaded) {
    return <header className="h-[64px] bg-white/70" />;
  }

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "APPROVE_SUCCESS", // Loại thông báo đặc biệt
      title: "Chúc mừng Đối tác!",
      desc: "Hồ sơ của bạn đã được duyệt. Nhấn để kích hoạt Kênh quản lý.",
      time: "Vừa xong",
      bg: "bg-green-100 text-green-600",
      icon: <CheckCircle size={20} />,
    },
  ]);

  const handleNotificationClick = (item) => {
    if (item.type === "APPROVE_SUCCESS") {
      window.location.reload();
    }
    setShowNotifications(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between font-jakarta">
        <Link
          to="/"
          className="font-cormorant font-bold text-2xl text-[#004D40] tracking-tighter"
        >
          D-PULSE{" "}
          <span className="text-xs font-jakarta font-black text-[#FFAB40] ml-1">
            ĐÀ NẴNG
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[#004D40]/70">
          <Link
            to="/services"
            className="hover:text-[#004D40] flex items-center gap-1.5"
          >
            <Map size={16} /> Khám phá
          </Link>
          <Link
            to="/ai-planner"
            className="text-[#FFAB40] flex items-center gap-1.5"
          >
            <Sparkles size={16} /> Lịch trình AI
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              {userRole === "USER" && (
                <Link
                  to="/become-partner"
                  className="hidden md:flex items-center gap-2 text-xs font-black uppercase text-[#004D40] border border-[#004D40]/10 px-4 py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#004D40] hover:text-white transition-all"
                >
                  <Store size={14} /> Đối tác
                </Link>
              )}

              {userRole === "OWNER" && (
                <Link
                  to="/owner"
                  className="bg-[#004D40] text-[#FFAB40] px-4 py-2 rounded-tr-xl rounded-bl-xl text-[10px] font-black tracking-widest shadow-lg flex items-center gap-2"
                >
                  <LayoutDashboard size={14} /> KÊNH QUẢN LÝ
                </Link>
              )}

              {userRole === "ADMIN" && (
                <Link
                  to="/admin"
                  className="bg-[#FF5252] text-white px-4 py-2 rounded-tr-xl rounded-bl-xl text-[10px] font-black tracking-widest shadow-lg flex items-center gap-2"
                >
                  <LayoutDashboard size={14} /> ADMIN DASHBOARD
                </Link>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-xl transition-all duration-200 relative ${showNotifications
                  ? "bg-[#004D40] text-white shadow-lg shadow-[#004D40]/20"
                  : "text-[#004D40] hover:bg-[#E0F2F1]"
                  }`}
              >
                <BellDot size={22} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FFAB40] rounded-full border-2 border-[#F5F5F5]"></span>
                )}
              </motion.button>

              <div className="relative">
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
                          <h3 className="font-bold text-[#004D40]">
                            Thông báo
                          </h3>
                        </div>

                        <div className="max-h-[350px] overflow-y-auto">
                          {notifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
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
                                  <p className="text-xs text-gray-500 mt-0.5">
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
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Lịch trình của tôi"
                    labelIcon={<CalendarDays size={16} />}
                    href="/my-itineraries"
                  />
                  <UserButton.Link
                    label="Đơn đặt của tôi"
                    labelIcon={<ReceiptText size={16} />}
                    href="/account?tab=bookings"
                  />
                  <UserButton.Link
                    label="Danh sách đã lưu"
                    labelIcon={<Heart size={16} />}
                    href="/account?tab=wishlist"
                  />
                  <UserButton.Link
                    label="Lịch trình cá nhân"
                    labelIcon={<Map size={16} />}
                    href="/account?tab=itineraries"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          ) : (
            <SignInButton mode="redirect" redirectUrl="/login">
              <button className="bg-[#FFAB40] text-white px-6 py-2 rounded-tr-xl rounded-bl-xl font-bold text-sm shadow-lg shadow-[#FFAB40]/20">
                Đăng nhập
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;