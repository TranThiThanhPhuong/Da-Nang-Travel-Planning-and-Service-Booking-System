import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';

const GlobalLoader = () => {
    return (
        <div className="h-screen w-full bg-[#F5F5F5] flex flex-col items-center justify-center relative overflow-hidden font-jakarta">

            {/* Hiệu ứng ánh sáng nền (Background Glow) */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FFAB40]/10 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#004D40]/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Nội dung chính */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Hiệu ứng Nhịp đập (Pulse Animation) */}
                <div className="relative flex items-center justify-center mb-8">
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute w-24 h-24 bg-[#FFAB40] rounded-full"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
                        className="absolute w-20 h-20 bg-[#004D40] rounded-full"
                    />

                    {/* Icon Trung tâm */}
                    <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-[#F5F5F5] z-10">
                        <MapPin className="text-[#004D40] mt-1" size={28} />
                    </div>
                </div>

                {/* Tên thương hiệu */}
                <h1 className="font-cormorant font-bold text-4xl text-[#004D40] tracking-tighter mb-3 flex items-center">
                    D-PULSE
                    <span className="text-[10px] font-jakarta font-black text-[#FFAB40] ml-1.5 uppercase tracking-widest">
                        Đà Nẵng
                    </span>
                </h1>

                {/* Dòng chữ Loading mang tính kể chuyện */}
                <div className="flex items-center gap-2 text-sm font-bold text-[#004D40]/60 bg-white/50 px-4 py-2 rounded-full border border-white shadow-sm backdrop-blur-sm">
                    <Sparkles size={16} className="text-[#FFAB40] animate-pulse" />
                    <span>Đang đánh thức nhịp đập thành phố...</span>
                </div>
            </motion.div>
        </div>
    );
};

export default GlobalLoader;