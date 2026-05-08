import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutDashboard, List, PlusSquare, CalendarDays, ClipboardList, CreditCard, Settings
} from 'lucide-react'
import { assets } from '../../assets/assets'

const Sidebar = () => {
    const menuItems = [
        { name: 'Tổng quan', path: '/owner', icon: <LayoutDashboard size={20} /> },
        { name: 'Quản lý dịch vụ', path: '/owner/list-service', icon: <List size={20} /> },
        { name: 'Thêm dịch vụ', path: '/owner/add-service', icon: <PlusSquare size={20} /> },
        { name: 'Quản lý tồn kho', path: '/owner/inventory', icon: <CalendarDays size={20} /> },
        { name: 'Quản lý đơn hàng', path: '/owner/bookings', icon: <ClipboardList size={20} /> },
        { name: 'Gói dịch vụ (SaaS)', path: '/owner/subscription', icon: <CreditCard size={20} /> },
        { name: 'Cài đặt thanh toán', path: '/owner/settings', icon: <Settings size={20} /> },
    ]
    const location = useLocation()

    return (
        <div className="w-64 bg-white/90 backdrop-blur-[10px] border-r border-white hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 font-jakarta">
            {/* Phần Logo */}
            <div className="h-20 flex items-center justify-center border-b border-gray-100">
                <Link to='/'>
                    <img
                        src={assets.logo}
                        alt="Logo D-PULSE"
                        className="h-12 w-auto object-contain scale-125"
                    />
                </Link>
            </div>

            {/* Phần Menu */}
            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-2">
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            end={item.path === '/owner'}
                            className={() => {
                                const isActive =
                                    item.path === '/owner'
                                    ? location.pathname === '/owner'
                                    : location.pathname.startsWith(item.path) || (item.path === '/owner/add-service' && location.pathname.startsWith('/owner/edit-service'));
                                return `flex items-center px-4 py-3 transition-all duration-300 ${
                                    isActive
                                    ? 'bg-[#004D40] text-white rounded-tr-[30px] rounded-bl-[30px] rounded-tl-md rounded-br-md shadow-md shadow-[#004D40]/20 font-bold'
                                    : 'text-gray-500 hover:bg-[#E0F2F1] hover:text-[#004D40] rounded-tr-[20px] rounded-bl-[20px] rounded-tl-sm rounded-br-sm font-medium'}`
                            }}
                        >
                            {({ isActive }) => (
                                <>
                                    <motion.div
                                        animate={{ scale: isActive ? 1.1 : 1, rotate: isActive ? [0, -10, 0] : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mr-3"
                                    >
                                        {item.icon}
                                    </motion.div>
                                    <span className="text-sm">{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    )
}

export default Sidebar