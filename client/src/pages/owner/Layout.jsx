import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/owner/Sidebar'
import Navbar from '../../components/owner/Navbar'
import Footer from '../../components/owner/Footer'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    return (
        <div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Lớp nền Texture Noise */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent flex flex-col relative z-10">
                    <div className="flex-1 p-8">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    )
}

export default Layout