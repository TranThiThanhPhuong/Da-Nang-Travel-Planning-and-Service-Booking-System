import React, { useEffect } from "react";
import { BellDot, CreditCard, UserPlus, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react"; // Giữ lại nếu dùng Clerk, nếu không dùng hãy comment lại
import NotificationDropdown from "../NotificationDropdown";

const Topbar = () => {
  const { user } = useUser(); 

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

        <NotificationDropdown userRole="ADMIN" />

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