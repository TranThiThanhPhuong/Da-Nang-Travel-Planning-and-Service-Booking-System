import React from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, List, Settings, LogOut, PlusSquare, CalendarDays, 
  ClipboardList, CreditCard, LayoutDashboard, X 
} from "lucide-react";
import { assets } from "../../assets/assets";

const menuItems = [
  { title: "Bảng điều khiển", icon: <LayoutDashboard size={20} />, path: "/owner" },
  { title: 'Quản lý dịch vụ', path: '/owner/list-service', icon: <List size={20} /> },
  { title: 'Thêm dịch vụ', path: '/owner/add-service', icon: <PlusSquare size={20} /> },
  { title: 'Quản lý tồn kho', path: '/owner/inventory', icon: <CalendarDays size={20} /> },
  { title: 'Quản lý đơn hàng', path: '/owner/bookings', icon: <ClipboardList size={20}/> },
  { title: 'Gói dịch vụ (SaaS)', path: '/owner/subscription', icon: <CreditCard size={20} /> },
  { title: 'Cài đặt thanh toán', path: '/owner/settings', icon: <Settings size={20}/> },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  return (
    <aside
      className={`bg-white/90 backdrop-blur-[10px] border-r border-white/50 
      flex flex-col transition-all duration-300 h-screen sticky top-0 z-20 font-jakarta
      shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Header: Logo & Toggle Button */}
      <div className="h-24 flex flex-col items-center justify-center relative border-b border-gray-100/50 px-2">
        {/* Nút Toggle - Đặt ở góc nếu mở, ở giữa nếu đóng */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute top-4 p-2 hover:bg-[#E0F2F1] text-[#004D40] rounded-full transition-all duration-300 ${
            isOpen ? "right-2" : "right-1/2 translate-x-1/2"
          }`}
        >
          {isOpen ? <X size={18} /> : <Menu size={22} />}
        </button>

        {/* Logo - Căn giữa tuyệt đối khi mở */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <Link to="/">
                <img 
                  src={assets.logo} 
                  alt="logo" 
                  className="h-12 w-auto object-contain scale-125" 
                />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={item.path === "/owner"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 transition-all duration-300 group ${
                isActive
                  ? "bg-[#004D40] text-white rounded-tr-[24px] rounded-bl-[24px] rounded-tl-md rounded-br-md shadow-lg shadow-[#004D40]/20 font-bold"
                  : "text-gray-500 hover:bg-[#E0F2F1] hover:text-[#004D40] rounded-tr-[16px] rounded-bl-[16px] rounded-tl-sm rounded-br-sm font-medium"
              } ${!isOpen ? "justify-center px-0" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  className={isActive ? "text-[#FFAB40]" : ""}
                >
                  {item.icon}
                </motion.div>
                
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.title}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;