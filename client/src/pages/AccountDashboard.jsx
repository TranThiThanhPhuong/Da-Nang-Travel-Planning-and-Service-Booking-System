import BookingList from '../components/Account/BookingList';
import WishlistGrid from '../components/Account/WishlistGrid';
import MyItineraries from "../components/Account/MyItineraries";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ReceiptText, Map, Settings, User } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AccountDashboard = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const tabFromUrl = searchParams.get('tab') || 'bookings';

    const [activeTab, setActiveTab] = useState(tabFromUrl);

    useEffect(() => {
        setActiveTab(tabFromUrl);
    }, [tabFromUrl]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Cập nhật lại thanh URL cho chuẩn, không tải lại trang (replace: true)
        navigate(`/account?tab=${tabId}`, { replace: true });
    };

    const sidebarMenu = [
        { id: 'bookings', label: 'Đơn đặt của tôi', icon: <ReceiptText size={20} /> },
        { id: 'wishlist', label: 'Danh sách đã lưu', icon: <Heart size={20} /> },
        { id: 'itineraries', label: 'Lịch trình cá nhân', icon: <Map size={20} /> },
        { id: 'settings', label: 'Cài đặt tài khoản', icon: <Settings size={20} /> }
    ];

    return (
        <div className="bg-[#F5F5F5] min-h-screen pt-32 pb-20 font-jakarta">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LỚP GIAO DIỆN SIDEBAR (LEFT PANEL - 3 CỘT) */}
                <aside className="lg:col-span-3 bg-white rounded-3xl p-6 border border-white shadow-xl flex flex-col items-center">
                    {/* Khối hiển thị thông tin User lấy từ Session Clerk */}
                    <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-gray-100 w-full">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-[#004D40]/10 shadow-inner bg-gray-50 flex items-center justify-center">
                            {user?.imageUrl ? (
                                <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-gray-400" />
                            )}
                        </div>
                        <h4 className="text-lg font-black text-[#004D40] truncate max-w-full">
                            {user?.fullName || 'Khách hàng của D-Pulse'}
                        </h4>
                        <p className="text-xs font-semibold text-gray-400 mt-1 truncate max-w-full">
                            {user?.primaryEmailAddress?.emailAddress}
                        </p>
                    </div>

                    {/* Danh sách các nút Tab điều hướng */}
                    <nav className="w-full space-y-1">
                        {sidebarMenu.map((item) => {
                            const isCurrent = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${isCurrent
                                        ? 'bg-[#004D40] text-[#FFAB40] shadow-md shadow-[#004D40]/10'
                                        : 'text-[#004D40]/70 hover:bg-gray-50 hover:text-[#004D40]'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* LỚP GIAO DIỆN NỘI DUNG CHÍNH (RIGHT PANEL - 9 CỘT) */}
                <main className="lg:col-span-9 bg-white rounded-3xl p-8 md:p-10 border border-white shadow-xl min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'bookings' && (
                            <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <h2 className="text-2xl font-black text-[#004D40] mb-2">Đơn đặt của tôi</h2>
                                <p className="text-sm font-medium text-gray-400 mb-8">Quản lý và theo dõi trạng thái các dịch vụ bạn đã đặt trên hệ thống.</p>
                                <BookingList />
                            </motion.div>
                        )}

                        {activeTab === 'wishlist' && (
                            <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <h2 className="text-2xl font-black text-[#004D40] mb-2">Danh sách đã lưu</h2>
                                <p className="text-sm font-medium text-gray-400 mb-8">Nơi lưu trữ các khách sạn, nhà hàng và hoạt động giải trí bạn yêu thích.</p>
                                <WishlistGrid />
                            </motion.div>
                        )}

                        {activeTab === 'itineraries' && (
                            <motion.div key="itineraries" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <h2 className="text-2xl font-black text-[#004D40] mb-2">Lịch trình cá nhân</h2>
                                <p className="text-sm font-medium text-gray-400 mb-8">Danh sách các kế hoạch, lộ trình tham quan do bạn xây dựng.</p>
                                <MyItineraries embedded={true} />
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <h2 className="text-2xl font-black text-[#004D40] mb-2">Cài đặt tài khoản</h2>
                                <p className="text-sm font-medium text-gray-400 mb-8">Thiết lập cấu hình bảo mật thông tin cá nhân của bạn.</p>
                                <div className="text-center py-20 text-gray-400 font-medium italic border-2 border-dashed border-gray-100 rounded-2xl">Phân hệ cài đặt đang bảo trì...</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
};

export default AccountDashboard;