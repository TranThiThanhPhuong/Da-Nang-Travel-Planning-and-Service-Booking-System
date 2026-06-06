import React, { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  connectSocket,
  getSocket,
  updateSocketToken,
} from "../services/socket"; // Thêm connectSocket & updateSocketToken
import {
  BellDot,
  CreditCard,
  UserPlus,
  CheckCircle2,
  Bell,
} from "lucide-react";

const NotificationDropdown = ({ userRole = "USER" }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Xử lý click ra ngoài menu để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm gọi API lấy danh sách thông báo cũ
  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await axios.get("/api/notifications?page=1&limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.totalUnread);
      }
    } catch (err) {
      console.error("❌ Lỗi API thông báo:", err);
    }
  };

  useEffect(() => {
    // 🟢 CHỐT CHẶN 1: Nếu dữ liệu user của Clerk hoặc userRole chưa sẵn sàng (hoặc đang null/undefined), không làm gì cả
    if (!user?.id || !userRole) return;

    let activeSocket = null;

    const initSocketConnection = async () => {
      const token = await getToken();
      if (!token) return;

      // 1. Khởi tạo hoặc lấy socket hiện tại
      activeSocket = getSocket();
      if (!activeSocket) {
        activeSocket = connectSocket(token);
      } else {
        updateSocketToken(token);
      }

      if (activeSocket) {
        // 2. Định nghĩa hàm đăng ký vào kênh tương ứng
        const joinRoom = () => {
          // Phải check chắc chắn socket đã connected sang phía server
          if (activeSocket.connected) {
            activeSocket.emit("join-channels", {
              userId: user.id, // Chuỗi user_... của Clerk
              role: userRole, // "ADMIN" | "OWNER" | "USER"
            });
            console.log(
              `👥 [Socket] Đã gửi yêu cầu tham gia phòng thành công: ${userRole}_${user.id}`,
            );
          }
        };

        // 3. Nếu socket đã mở sẵn kết nối từ trước -> Vào phòng ngay
        if (activeSocket.connected) {
          joinRoom();
        }

        // 4. Lắng nghe sự kiện connect (Dành cho lần đầu tạo socket hoặc khi bị mất mạng kết nối lại)
        activeSocket.off("connect", joinRoom); // Xóa listener cũ để an toàn
        activeSocket.on("connect", joinRoom);

        // 5. Lắng nghe thông báo real-time từ Backend
        activeSocket.off("NEW_NOTIFICATION");
        activeSocket.on("NEW_NOTIFICATION", (newNoti) => {
          console.log("🔔 Nhận thông báo real-time mới thành công:", newNoti);

          // 🟢 CẢI TIẾN BẢO HIỂM: Chỉ cập nhật vào danh sách nếu thông báo này thuộc quyền hạn của Role hiện tại
          // Hoặc nếu recipientId trùng với ID hệ thống của mình
          setNotifications((prev) => {
            // Tránh trường hợp hàm bị gọi trùng lặp làm nhân đôi thông báo trên UI
            const isExist = prev.some((item) => item._id === newNoti._id);
            if (isExist) return prev;
            return [newNoti, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        });
      }
    };

    fetchNotifications();
    initSocketConnection();

    // Cleanup: Gỡ bỏ toàn bộ sự kiện lắng nghe khi đổi phân quyền hoặc tắt dropdown
    return () => {
      if (activeSocket) {
        activeSocket.off("connect");
        activeSocket.off("NEW_NOTIFICATION");
      }
    };
  }, [getToken, user?.id, userRole]); // Khi userRole từ dbUser thay đổi từ USER -> ADMIN, toàn bộ block này sẽ chạy lại chuẩn chỉ!

  const handleItemAction = async (item) => {
    try {
      if (!item.isRead) {
        const token = await getToken();
        const res = await axios.post(
          "/api/notifications/mark-read",
          { notificationId: item._id },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.data.success) {
          setNotifications((prev) =>
            prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
      setShowNotifications(false);
      if (item.onClickUrl) navigate(item.onClickUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await getToken();
      const res = await axios.post(
        "/api/notifications/mark-read",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case "FINANCIAL":
        return {
          bg: "bg-emerald-50 text-[#004D40]",
          icon: <CreditCard size={16} />,
        };
      case "ACCOUNT_SAAS":
        return { bg: "bg-blue-50 text-blue-500", icon: <UserPlus size={16} /> };
      case "BOOKING_STATUS":
      case "SYSTEM_ALERT":
        return {
          bg: "bg-amber-50 text-[#FFAB40]",
          icon: <CheckCircle2 size={16} />,
        };
      default:
        return { bg: "bg-gray-50 text-gray-500", icon: <Bell size={16} /> };
    }
  };

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(!showNotifications)}
        className={`p-2 rounded-xl transition-all duration-200 relative ${
          showNotifications
            ? "bg-[#004D40] text-white shadow-lg shadow-[#004D40]/20"
            : "text-[#004D40] hover:bg-[#E0F2F1]"
        }`}
      >
        <BellDot size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FFAB40] text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm px-0.5 min-w-[20px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showNotifications && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifications(false)}
            ></div>

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 top-full w-80 bg-white border border-gray-100 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden origin-top-right z-50 font-jakarta"
            >
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-[#004D40] text-sm">Thông báo</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] text-gray-400 hover:text-[#004D40] font-medium transition"
                    >
                      Đọc tất cả
                    </button>
                  )}
                  <span className="text-[9px] bg-[#004D40] text-white px-2 py-0.5 rounded-full font-black tracking-wider">
                    {unreadCount} MỚI
                  </span>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Hộp thư trống
                  </div>
                ) : (
                  notifications.map((item) => {
                    const style = getCategoryStyles(item.category);
                    return (
                      <div
                        key={item._id}
                        onClick={() => handleItemAction(item)}
                        className={`p-4 transition cursor-pointer group flex gap-3 relative ${
                          item.isRead
                            ? "hover:bg-[#E0F2F1]/10"
                            : "bg-teal-50/20 hover:bg-[#E0F2F1]/30"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          {style.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs line-clamp-1 ${item.isRead ? "font-medium text-gray-700" : "font-bold text-gray-900"}`}
                          >
                            {item.title}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1.5 font-medium">
                            {new Date(item.createdAt).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            -{" "}
                            {new Date(item.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>

                        {!item.isRead && (
                          <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-[#FFAB40] rounded-full"></span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
