import React from 'react'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, CalendarCheck, TrendingUp, Lock, Zap } from 'lucide-react'

// Dữ liệu giả lập
const revenueData = [
    { month: 'Tháng 11', revenue: 4500 },
    { month: 'Tháng 12', revenue: 5200 },
    { month: 'Tháng 1', revenue: 3800 },
    { month: 'Tháng 2', revenue: 4200 },
    { month: 'Tháng 3', revenue: 5900 },
    { month: 'Tháng 4', revenue: 6300 },
]

const recentBookings = [
    { id: 'BK001', guest: 'Lê Văn Tuấn Lộc', service: 'Phòng Deluxe Sea View', status: 'Đã thanh toán', amount: 1200 },
    { id: 'BK002', guest: 'Trần Thị Thanh Phương', service: 'Tour Ngũ Hành Sơn', status: 'Chờ xác nhận', amount: 450 },
    { id: 'BK003', guest: 'Nguyễn Văn A', service: 'Bàn tiệc nướng BBQ', status: 'Đã xác nhận', amount: 800 },
    { id: 'BK004', guest: 'Phạm Minh B', service: 'Phòng Suite Luxury', status: 'Đã hủy', amount: 2100 },
]

const Dashboard = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const currentPackage = user?.publicMetadata?.currentPackage || 'STARTER';
    const isStatsLocked = currentPackage === 'STARTER';

    return (
        <div className="space-y-8 font-jakarta">

            {/* 1. Hàng thẻ thống kê nhanh (Bento Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng doanh thu" value="$24,850" trend="+12.5% so với tháng trước" delay={0.1}
                    icon={<DollarSign className="text-[#004D40]" />}
                />
                <StatCard
                    title="Đơn hàng mới" value="156" trend="+5.2% từ hôm qua" delay={0.2}
                    icon={<CalendarCheck className="text-[#FFAB40]" />}
                />
                <StatCard
                    title="Tỉ lệ lấp đầy" value="78%" trend="Cao hơn trung bình 4%" delay={0.3}
                    icon={<TrendingUp className="text-[#004D40]" />}
                />
                <StatCard
                    title="Gói dịch vụ" value="Gói Pro" trend="Còn 14 ngày sử dụng" delay={0.4} isSpecial
                    icon={<Users className="text-[#FFAB40]" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Biểu đồ doanh thu */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-sm border border-white/40"
                >
                    <h3 className="text-lg font-cormorant font-bold text-[#004D40] mb-6 text-2xl">Doanh thu 6 tháng gần nhất</h3>
                    <div className={`h-80 w-full transition-all duration-500 ${isStatsLocked ? 'filter blur-[8px] opacity-40 select-none pointer-events-none' : ''}`}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0F2F1" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#004D40', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#004D40', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#E0F2F1' }} contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#ffffffcc', backdropFilter: 'blur(10px)' }} />
                                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={40}>
                                    {revenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === revenueData.length - 1 ? '#FFAB40' : '#004D40'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {isStatsLocked && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[2px]">
                            <div className="bg-white/90 p-6 rounded-3xl shadow-2xl border border-[#E0F2F1] flex flex-col items-center text-center max-w-xs sm:max-w-sm">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 text-[#FFAB40]">
                                    <Lock size={24} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-black text-[#004D40] mb-1">Tính năng Cao cấp</h3>
                                <p className="text-xs font-medium text-gray-500 mb-4 leading-relaxed">
                                    Nâng cấp lên gói <strong>Chuyên nghiệp (PRO)</strong> để mở khóa báo cáo phân tích dòng tiền và xu hướng khách hàng chi tiết.
                                </p>
                                <button
                                    onClick={() => navigate('/owner/subscription')}
                                    className="w-full bg-[#FFAB40] text-white py-2.5 rounded-xl font-bold hover:bg-[#e59939] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFAB40]/20 text-sm"
                                >
                                    <Zap size={16} /> Khám phá các gói
                                </button>
                            </div>
                        </div>
                    )}

                </motion.div>

                {/* 3. Đơn hàng gần đây */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-sm border border-white/40"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-cormorant font-bold text-[#004D40] text-2xl">Đơn hàng mới</h3>
                        <button className="text-sm text-[#FFAB40] font-bold hover:underline">Xem tất cả</button>
                    </div>
                    <div className="space-y-5">
                        {recentBookings.map((booking, idx) => (
                            <motion.div whileHover={{ x: 5 }} key={booking.id} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md bg-[#E0F2F1] flex items-center justify-center font-bold text-[#004D40] group-hover:bg-[#FFAB40] group-hover:text-white transition-colors">
                                        {booking.guest.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#004D40]">{booking.guest}</p>
                                        <p className="text-xs text-gray-500">{booking.service}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-[#004D40]">${booking.amount}</p>
                                    <p className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${booking.status === 'Đã thanh toán' ? 'bg-[#E0F2F1] text-[#004D40]' :
                                        booking.status === 'Chờ xác nhận' ? 'bg-orange-100 text-[#FFAB40]' :
                                            booking.status === 'Đã xác nhận' ? 'bg-[#004D40] text-white' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {booking.status}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

// Component thẻ thống kê có hiệu ứng Spring
const StatCard = ({ title, value, icon, trend, isSpecial, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay }}
        whileHover={{ y: -5 }}
        className={`p-6 shadow-sm border border-white/50 transition-all ${isSpecial
            ? 'bg-gradient-to-br from-[#004D40] to-[#00332A] text-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-xl rounded-br-xl'
            : 'bg-white/80 backdrop-blur-[10px] text-[#004D40] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-xl rounded-br-xl'
            }`}
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md ${isSpecial ? 'bg-white/20' : 'bg-[#E0F2F1]'}`}>
                {icon}
            </div>
        </div>
        <div>
            <p className={`text-sm font-medium ${isSpecial ? 'text-[#E0F2F1]' : 'text-gray-500'}`}>{title}</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight">{value}</h3>
            <p className={`text-xs mt-2 ${isSpecial ? 'text-[#FFAB40]' : 'text-gray-400'}`}>
                {trend}
            </p>
        </div>
    </motion.div>
)

export default Dashboard