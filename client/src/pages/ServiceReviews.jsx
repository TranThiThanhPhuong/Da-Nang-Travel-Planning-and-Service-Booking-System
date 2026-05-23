import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Image, Calendar, ChevronDown, UserX, SlidersHorizontal, Check, User } from 'lucide-react';
import ImageZoomModal from './common/ImageZoomModal';

const ServiceReviews = ({ reviews = [] }) => {
    const [selectedStar, setSelectedStar] = useState('ALL'); // 'ALL', 5, 4, 3, 2, 1
    const [onlyHasImages, setOnlyHasImages] = useState(false);
    const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST', 'OLDEST', 'RATING_HIGH', 'RATING_LOW'
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    const summary = useMemo(() => {
        const total = reviews.length;
        if (total === 0) return { avg: 0, total: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, percents: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = (sum / total).toFixed(1);

        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (counts[r.rating] !== undefined) counts[r.rating]++;
        });

        const percents = {};
        for (let i = 1; i <= 5; i++) {
            percents[i] = Math.round((counts[i] / total) * 100);
        }

        return { avg, total, counts, percents };
    }, [reviews]);

    const filteredAndSortedReviews = useMemo(() => {
        let result = [...reviews];

        // Lọc theo số sao
        if (selectedStar !== 'ALL') {
            result = result.filter(r => r.rating === Number(selectedStar));
        }

        // Lọc chỉ xem đánh giá có ảnh
        if (onlyHasImages) {
            result = result.filter(r => r.images && r.images.length > 0);
        }

        // Thực hiện sắp xếp (Sort)
        if (sortBy === 'NEWEST') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'OLDEST') {
            result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'RATING_HIGH') {
            result.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'RATING_LOW') {
            result.sort((a, b) => a.rating - b.rating);
        }

        return result;
    }, [reviews, selectedStar, onlyHasImages, sortBy]);

    const sortOptions = {
        NEWEST: 'Mới nhất',
        OLDEST: 'Cũ nhất',
        RATING_HIGH: 'Điểm cao nhất',
        RATING_LOW: 'Điểm thấp nhất'
    };

    return (
        <div className="mt-16 space-y-10 font-jakarta">
            {/* TIÊU ĐỀ SECTION ĐẬM CHẤT D-PULSE */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200/60 pb-5">
                <div>
                    <h2 className="text-4xl font-bold font-cormorant text-[#004D40] tracking-tight">
                        Đánh giá từ cộng đồng
                    </h2>
                    <p className="text-sm text-gray-400 font-medium mt-1">Những trải nghiệm thực tế từ du khách tại Đà Nẵng</p>
                </div>
                <div className="text-sm font-bold text-[#004D40] bg-[#E0F2F1] px-4 py-2 rounded-tr-xl rounded-bl-xl shadow-sm">
                    Tổng cộng: {summary.total} bình luận
                </div>
            </div>

            {/* 📊 KHU VỰC THỐNG KÊ NHANH (RATING SUMMARY) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white border border-teal-50/60 p-8 rounded-tr-[2.5rem] rounded-bl-[2.5rem] shadow-sm relative overflow-hidden">
                {/* Hiệu ứng Phông Nền Nhiễu Nhẹ / Texture giả lập */}
                <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]" />

                {/* Điểm số trung bình */}
                <div className="flex flex-col items-center justify-center text-center md:border-r border-gray-100 p-4">
                    <h4 className="text-6xl font-black text-[#004D40] flex items-baseline">
                        {summary.avg}
                        <span className="text-xl text-gray-300 font-normal">/5</span>
                    </h4>
                    <div className="flex gap-1 my-3">
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                                key={s} 
                                size={18} 
                                className={`${s <= Math.round(summary.avg) ? 'text-[#FFAB40] fill-[#FFAB40]' : 'text-gray-200'}`} 
                            />
                        ))}
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Điểm đánh giá trung bình</p>
                </div>

                {/* Thanh tiến trình Progress Bar (5 sao -> 1 sao) */}
                <div className="col-span-2 flex flex-col justify-center space-y-2.5">
                    {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-4 text-xs font-semibold text-[#004D40]">
                            <span className="w-12 flex items-center gap-1 shrink-0 font-bold">
                                {star} <Star size={13} className="text-[#FFAB40] fill-[#FFAB40]" />
                            </span>
                            {/* Thanh tiến trình chính */}
                            <div className="flex-1 h-3 bg-[#F5F5F5] rounded-full overflow-hidden shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${summary.percents[star]}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#004D40] to-[#00796B] rounded-full"
                                />
                            </div>
                            <span className="w-12 text-right text-gray-400 font-bold shrink-0">
                                {summary.percents[star]}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🛠️ THANH BỘ LỌC VÀ SẮP XẾP (FILTER & SORT BAR) */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                {/* Lọc theo sao */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        onClick={() => setSelectedStar('ALL')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedStar === 'ALL' ? 'bg-[#004D40] text-white shadow-md shadow-[#004D40]/10' : 'bg-[#F5F5F5] text-gray-500 hover:bg-gray-100'}`}
                    >
                        Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map(star => (
                        <button
                            key={star}
                            onClick={() => setSelectedStar(star)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${selectedStar === star ? 'bg-[#004D40] text-white shadow-md shadow-[#004D40]/10' : 'bg-[#F5F5F5] text-gray-500 hover:bg-gray-100'}`}
                        >
                            {star} <Star size={12} className={selectedStar === star ? "fill-white" : "text-[#FFAB40] fill-[#FFAB40]"} />
                        </button>
                    ))}
                </div>

                {/* Checkbox ảnh & Dropdown Sắp xếp */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                    {/* Filter Có Ảnh */}
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-500 font-bold group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={onlyHasImages} 
                                onChange={(e) => setOnlyHasImages(e.target.checked)} 
                                className="sr-only" 
                            />
                            <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${onlyHasImages ? 'bg-[#004D40] border-[#004D40]' : 'border-gray-300 group-hover:border-[#004D40]'}`}>
                                {onlyHasImages && <Check size={10} className="text-white stroke-[4]" />}
                            </div>
                        </div>
                        <span className="flex items-center gap-1"><Image size={14} /> Có hình ảnh</span>
                    </label>

                    {/* Dropdown Sắp xếp */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F5F5F5] text-[#004D40] hover:bg-gray-100 transition-all flex items-center gap-1.5"
                        >
                            <SlidersHorizontal size={12} /> {sortOptions[sortBy]} <ChevronDown size={14} className={`transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isSortDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-1 overflow-hidden"
                                    >
                                        {Object.entries(sortOptions).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setSortBy(key);
                                                    setIsSortDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors block ${sortBy === key ? 'bg-[#E0F2F1] text-[#004D40]' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* 📜 DANH SÁCH REVIEW THỰC TẾ (REVIEWS LIST) */}
            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {filteredAndSortedReviews.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <UserX size={26} />
                            </div>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Không tìm thấy kết quả</p>
                        </motion.div>
                    ) : (
                        filteredAndSortedReviews.map((review) => (
                            <motion.div
                                key={review._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white p-6 md:p-8 rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-2xl rounded-br-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 relative group transition-all duration-300 hover:shadow-md hover:border-teal-100/70 overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#004D40] to-[#009688] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* 👤 Cột Người đánh giá (Cải tiến To Rõ Ràng) */}
                                <div className="w-full md:w-52 shrink-0 flex items-center md:items-start gap-4 md:flex-col border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                                    <div className="w-16 h-16 rounded-2xl rounded-tl-sm overflow-hidden bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] text-[#004D40] flex items-center justify-center shrink-0 shadow-sm font-bold border-2 border-white ring-4 ring-teal-50/40">
                                        {review.isAnonymous ? (
                                            <UserX size={24} className="text-[#004D40]/60" />
                                        ) : review.userId?.avatar && review.userId.avatar.trim() !== "" ? (
                                            <img 
                                                src={review.userId.avatar} 
                                                alt="Avatar du khách" 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004D40" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                                }}
                                            />
                                        ) : (
                                            <User size={18} className="text-[#004D40]" />
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1 md:flex-none">
                                        <h5 className="text-base font-black text-[#004D40] tracking-tight leading-snug break-words">
                                            {review.userId?.fullName || 'Người dùng ẩn danh'}
                                        </h5>
                                        <p className="text-xs text-gray-400 font-semibold flex items-center gap-1.5 font-mono">
                                            <Calendar size={12} className="text-gray-300 shrink-0" /> 
                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                {/* 💬 Cột Nội dung Đánh giá & Khối Ảnh Phóng Đại */}
                                <div className="flex-1 flex flex-col justify-between space-y-6">
                                    <div className="space-y-3.5">
                                        <div className="flex gap-0.5 bg-amber-50/60 w-fit px-2.5 py-1 rounded-lg border border-amber-100/40 shadow-sm">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star 
                                                    key={s} 
                                                    size={14} 
                                                    className={`${s <= review.rating ? 'text-[#FFAB40] fill-[#FFAB40]' : 'text-gray-200'}`} 
                                                />
                                            ))}
                                        </div>
                                        <div className="flex-1">
                                            {review.comment && review.comment.trim() !== "" ? (
                                                <p className="text-base font-medium text-gray-700 leading-relaxed whitespace-pre-line tracking-normal pr-2 md:text-[16px]">
                                                {review.comment}
                                                </p>
                                            ) : (
                                            <p className="text-base font-medium text-gray-700 tracking-wide bg-gray-50/50 inline-block px-3 py-1.5 rounded-lg border border-dashed border-gray-100">
                                                Khách hàng chỉ để lại đánh giá sao dịch vụ này.
                                            </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 📸 Mảng hình ảnh thực tế tối đa 5 tấm - Kích thước w-28 h-28 siêu nét */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex flex-wrap gap-3.5 pt-2">
                                            {review.images.map((img, index) => (
                                                <div 
                                                    key={index} 
                                                    className="w-28 h-28 rounded-2xl rounded-tl-sm overflow-hidden border border-gray-100 shadow-md relative cursor-zoom-in group/img bg-gray-50"
                                                    onClick={() => setActiveImage({ url: img, title: `Ảnh thực tế #${index + 1}` })}
                                                >
                                                    <img 
                                                        src={img} 
                                                        alt="Hình ảnh thực tế từ du khách" 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-108" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                                        <span className="text-[11px] font-black text-white bg-[#004D40]/90 px-2.5 py-1 rounded-lg tracking-wider shadow-md transform translate-y-2 group-hover/img:translate-y-0 transition-transform duration-300">
                                                            PHÓNG TO
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {activeImage && (
                    <ImageZoomModal 
                        image={activeImage} 
                        onClose={() => setActiveImage(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ServiceReviews;