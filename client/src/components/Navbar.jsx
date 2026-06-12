import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { Sparkles, Map, Store, LayoutDashboard, Heart, ReceiptText, Home } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = ({ user: dbUser }) => {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();
  const userRole = dbUser?.role || "USER";

  if (!isLoaded) {
    return <header className="h-[64px] bg-white/70" />;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between font-jakarta">
        <Link to="/" className="font-cormorant font-bold text-2xl text-[#004D40] tracking-tighter">
          D-PULSE <span className="text-xs font-jakarta font-black text-[#FFAB40] ml-1">ĐÀ NẴNG</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
          <Link
            to="/"
            className={`flex items-center gap-1.5 transition-colors ${isActive("/") ? "text-[#FFAB40]" : "text-[#004D40]/70 hover:text-[#004D40]"}`}
          >
            <Home size={16} /> Trang chủ
          </Link>
          <Link
            to="/services"
            className={`flex items-center gap-1.5 transition-colors ${isActive("/services") ? "text-[#FFAB40]" : "text-[#004D40]/70 hover:text-[#004D40]"}`}
          >
            <Map size={16} /> Khám phá
          </Link>
          <Link
            to="/ai-planner"
            className={`flex items-center gap-1.5 transition-colors ${isActive("/ai-planner") ? "text-[#FFAB40]" : "text-[#004D40]/70 hover:text-[#004D40]"}`}
          >
            <Sparkles size={16} /> Lịch trình AI
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isSignedIn && dbUser ? (
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

              <NotificationDropdown userRole={userRole} />

              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  <UserButton.Link label="Đơn đặt của tôi" labelIcon={<ReceiptText size={16} />} href="/account?tab=bookings" />
                  <UserButton.Link label="Danh sách đã lưu" labelIcon={<Heart size={16} />} href="/account?tab=wishlist" />
                  <UserButton.Link label="Lịch trình cá nhân" labelIcon={<Map size={16} />} href="/account?tab=itineraries" />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          ) : (
            !isSignedIn && (
              <Link to="/login" className="bg-[#FFAB40] text-white px-6 py-2 rounded-tr-xl rounded-bl-xl font-bold text-sm shadow-lg shadow-[#FFAB40]/20">
                Đăng nhập
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;