import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Filter, Utensils, Bed, Ticket, ChevronRight, SlidersHorizontal, Tag, ChevronDown, Sparkles, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../hooks/axios'
import api from '../hooks/axios';
import { useAuth, useUser } from '@clerk/clerk-react';

const AllServices = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { getToken } = useAuth();
    const { isSignedIn } = useUser();

    // Hàm bổ trợ đọc các URL Query Parameters ban đầu
    const getQueryParam = (param) => {
        return new URLSearchParams(location.search).get(param);
    };

    // --- 1. STATE QUẢN LÝ DỮ LIỆU & PHÂN TRANG ---
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // --- 2. STATE QUẢN LÝ BỘ LỌC & SẮP XẾP ---
    const [category, setCategory] = useState(getQueryParam('type') || 'ALL');
    const [keyword, setKeyword] = useState(getQueryParam('keyword') || '');
    const [debouncedKeyword, setDebouncedKeyword] = useState(getQueryParam('keyword') || '');

    // STATE QUẢN LÝ TỒN KHO LỊCH
    const [startDate, setStartDate] = useState(getQueryParam('startDate') || '');
    const [endDate, setEndDate] = useState(getQueryParam('endDate') || '');

    const [selectedAreas, setSelectedAreas] = useState([]);
    const [priceRange, setPriceRange] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [hasDiscount, setHasDiscount] = useState(false);
    const [sortOption, setSortOption] = useState('newest');

    const categories = [
        { id: 'ALL', label: 'Tất cả', icon: <Filter size={14} /> },
        { id: 'HOTEL', label: 'Lưu trú', icon: <Bed size={14} /> },
        { id: 'RESTAURANT', label: 'Ẩm thực', icon: <Utensils size={14} /> },
        { id: 'ACTIVITY', label: 'Trải nghiệm', icon: <Ticket size={14} /> },
    ];

    const areasList = ['Quận Hải Châu', 'Quận Ngũ Hành Sơn', 'Quận Sơn Trà', 'Quận Liên Chiểu', 'Huyện Hòa Vang'];

    const priceOptions = [
        { id: '', label: 'Mọi mức giá' },
        { id: '0-500000', label: 'Dưới 500.000đ' },
        { id: '500000-1500000', label: '500.000đ - 1.500.000đ' },
        { id: '1500000-3000000', label: '1.500.000đ - 3.000.000đ' },
        { id: '3000000-', label: 'Trên 3.000.000đ' },
    ];

    // Cập nhật State khi URL thay đổi
    useEffect(() => {
        const typeParam = getQueryParam('type') || 'ALL';
        const keywordParam = getQueryParam('keyword') || '';
        const startParam = getQueryParam('startDate') || '';
        const endParam = getQueryParam('endDate') || '';

        setCategory(typeParam);
        setKeyword(keywordParam);
        setDebouncedKeyword(keywordParam);
        setStartDate(startParam);
        setEndDate(endParam);
    }, [location.search]);

    // --- LOGIC XỬ LÝ RÀNG BUỘC NGÀY CHỌN TỪ LỊCH ---
    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        // Nếu ngày kết thúc đang nhỏ hơn ngày bắt đầu mới chọn, tự động đẩy ngày kết thúc lên
        if (endDate && newStart > endDate) {
            setEndDate(newStart);
        }
    };

    const handleEndDateChange = (e) => {
        const newEnd = e.target.value;
        setEndDate(newEnd);
        // Nếu cố tình chọn ngày kết thúc nhỏ hơn ngày bắt đầu, tự động kéo ngày bắt đầu lùi về
        if (startDate && newEnd < startDate) {
            setStartDate(newEnd);
        }
    };

    // --- 3. LOGIC DEBOUNCE TÌM KIẾM ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    // LƯU TỪ KHÓA TÌM KIẾM DƯỚI NỀN
    useEffect(() => {
        const saveSearchHistory = async () => {
            if (isSignedIn && debouncedKeyword.trim().length > 1) {
                try {
                    const token = await getToken();
                    await axios.post('/api/users/save-search',
                        { keyword: debouncedKeyword.trim() },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } catch (error) {
                    console.error("Lỗi lưu lịch sử tìm kiếm", error);
                }
            }
        };

        saveSearchHistory();
    }, [debouncedKeyword, isSignedIn, getToken]);

    // --- 4. LOGIC GỌI API ---
    const fetchServices = async (isLoadMore = false) => {
        try {
            setLoading(true);
            const currentPage = isLoadMore ? page : 1;

            const params = new URLSearchParams({
                page: currentPage,
                limit: 6,
                type: category
            });

            if (debouncedKeyword.trim()) params.append('keyword', debouncedKeyword.trim());
            if (selectedAreas.length > 0) params.append('areas', selectedAreas.join(','));
            if (hasDiscount) params.append('hasDiscount', 'true');
            if (minRating > 0) params.append('minRating', minRating);
            if (sortOption && sortOption !== 'newest') params.append('sort', sortOption);

            // TRUYỀN LÊN API ĐỂ LỌC THEO TỒN KHO
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            if (priceRange) {
                const [min, max] = priceRange.split('-');
                if (min) params.append('minPrice', min);
                if (max) params.append('maxPrice', max);
            }

            const response = await api.get(`/api/services?${params.toString()}`);
            const data = response.data;

            if (data.success) {
                if (isLoadMore) {
                    setServices(prev => [...prev, ...data.data]);
                } else {
                    setServices(data.data);
                }
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    // Lắng nghe sự thay đổi của bộ lọc để gọi lại API
    useEffect(() => {
        setPage(1);
        fetchServices(false);
    }, [category, debouncedKeyword, selectedAreas, priceRange, minRating, hasDiscount, sortOption, startDate, endDate]);

    useEffect(() => {
        if (page > 1) {
            fetchServices(true);
        }
    }, [page]);

    // --- 5. LOGIC XỬ LÝ EVENT BỘ LỌC ---
    const handleAreaChange = (area) => {
        setSelectedAreas(prev =>
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    // --- 6. CUSTOM DROPDOWN SẮP XẾP ---
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef(null);

    const sortOptions = [
        { value: 'newest', label: 'Mới nhất', icon: <Sparkles size={16} /> },
        { value: 'price_asc', label: 'Giá: Thấp đến Cao', icon: <TrendingUp size={16} /> },
        { value: 'price_desc', label: 'Giá: Cao xuống Thấp', icon: <TrendingDown size={16} /> },
        { value: 'rating_desc', label: 'Đánh giá cao nhất', icon: <Star size={16} className="fill-current" /> },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentSortOption = sortOptions.find(opt => opt.value === sortOption) || sortOptions[0];

    return (
        <div className="bg-[#F5F5F5] min-h-screen font-jakarta pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-6">

                {/* TOP BAR: SEARCH, DATE PICKER, CATEGORIES & SORT */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-12">
                    <div>
                        <h1 className="text-5xl font-cormorant font-bold text-[#004D40] mb-4">Khám phá Đà Nẵng</h1>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-tr-2xl rounded-bl-2xl border border-white shadow-sm overflow-x-auto">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-5 py-2.5 rounded-tr-xl rounded-bl-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${category === cat.id ? 'bg-[#004D40] text-white shadow-lg' : 'text-[#004D40]/50 hover:text-[#004D40]'}`}
                                    >
                                        {cat.icon} {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Dropdown Sắp xếp */}
                            <div className="relative z-20" ref={sortRef}>
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="flex items-center justify-between gap-3 bg-white border-none shadow-sm rounded-tr-xl rounded-bl-xl px-5 py-3 font-bold text-[#004D40] outline-none cursor-pointer focus:ring-2 focus:ring-[#FFAB40]/50 text-sm min-w-[240px] transition-all"
                                >
                                    <div className="flex items-center gap-2 text-[#FFAB40]">
                                        {currentSortOption.icon}
                                        <span className="text-[#004D40] ml-1">{currentSortOption.label}</span>
                                    </div>
                                    <ChevronDown
                                        size={18}
                                        className={`text-[#004D40]/50 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {isSortOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full mt-2 left-0 w-full bg-white rounded-xl shadow-xl border border-[#E0F2F1] overflow-hidden"
                                        >
                                            {sortOptions.map((option) => (
                                                <div
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortOption(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors text-sm font-bold
                                                        ${sortOption === option.value
                                                            ? 'bg-[#004D40]/5 text-[#FFAB40]'
                                                            : 'text-[#004D40]/70 hover:bg-[#E0F2F1]/50 hover:text-[#004D40]'
                                                        }
                                                    `}
                                                >
                                                    <span className={sortOption === option.value ? 'text-[#FFAB40]' : 'text-[#004D40]/40'}>
                                                        {option.icon}
                                                    </span>
                                                    {option.label}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* MẢNG GIAO DIỆN TÌM KIẾM (CÓ BỘ LỌC LỊCH CHUẨN) */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">

                        {/* Lọc theo Lịch */}
                        <div className="flex items-center justify-between gap-2 bg-white rounded-tr-3xl rounded-bl-3xl shadow-sm px-5 py-4 border border-white focus-within:ring-2 focus-within:ring-[#FFAB40]/50 transition-all flex-1 md:w-auto">
                            <Calendar size={20} className="text-[#004D40]/30 shrink-0" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                                className="bg-transparent font-bold text-[#004D40] outline-none text-xs cursor-pointer w-full max-w-[120px]"
                                min={new Date().toISOString().split('T')[0]}
                                title="Ngày bắt đầu"
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                                className="bg-transparent font-bold text-[#004D40] outline-none text-xs cursor-pointer w-full max-w-[120px]"
                                min={startDate || new Date().toISOString().split('T')[0]}
                                title="Ngày kết thúc"
                            />
                        </div>

                        {/* Ô Tìm Kiếm Kí Tự */}
                        <div className="w-full md:w-80 relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/30" size={20} />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm tên dịch vụ, khu vực..."
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-tr-3xl rounded-bl-3xl border-none shadow-sm outline-none focus:ring-2 focus:ring-[#FFAB40]/50 font-bold text-[#004D40]"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* SIDEBAR FILTER */}
                    <aside className="lg:col-span-3 space-y-8">
                        <div className="bg-white/80 backdrop-blur-md p-8 rounded-tr-[40px] rounded-bl-[40px] shadow-xl border border-white sticky top-28">
                            <h3 className="font-cormorant text-2xl font-bold text-[#004D40] mb-6 flex items-center gap-2">
                                <SlidersHorizontal size={20} className="text-[#FFAB40]" /> Bộ lọc
                            </h3>

                            <div className="space-y-8">
                                {/* KHUYẾN MÃI */}
                                <label className="flex items-center justify-between cursor-pointer group bg-[#E0F2F1]/50 p-3 rounded-xl border border-[#E0F2F1]">
                                    <div className="flex items-center gap-2 text-[#004D40]">
                                        <Tag size={16} className="text-[#FFAB40]" />
                                        <span className="text-sm font-bold">Đang khuyến mãi</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={hasDiscount}
                                        onChange={() => setHasDiscount(!hasDiscount)}
                                        className="w-4 h-4 rounded border-[#004D40] text-[#FFAB40] focus:ring-[#FFAB40] accent-[#FFAB40]"
                                    />
                                </label>

                                {/* KHU VỰC */}
                                <div>
                                    <p className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-[0.2em] mb-4">Khu vực</p>
                                    <div className="max-h-60 overflow-y-auto pr-2">
                                        {areasList.map(area => (
                                            <label key={area} className="flex items-center gap-3 mb-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAreas.includes(area)}
                                                    onChange={() => handleAreaChange(area)}
                                                    className="w-4 h-4 rounded border-[#E0F2F1] text-[#004D40] focus:ring-[#004D40] accent-[#004D40]"
                                                />
                                                <span className="text-sm font-bold text-[#004D40]/70 group-hover:text-[#004D40] transition-colors">{area}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* MỨC GIÁ */}
                                <div className="pt-6 border-t border-[#E0F2F1]">
                                    <p className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-[0.2em] mb-4">Mức giá</p>
                                    {priceOptions.map(option => (
                                        <label key={option.id} className="flex items-center gap-3 mb-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="priceRange"
                                                checked={priceRange === option.id}
                                                onChange={() => setPriceRange(option.id)}
                                                className="w-4 h-4 border-[#E0F2F1] text-[#FFAB40] focus:ring-[#FFAB40] accent-[#FFAB40]"
                                            />
                                            <span className="text-sm font-bold text-[#004D40]/70 group-hover:text-[#004D40] transition-colors">{option.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* ĐÁNH GIÁ */}
                                <div className="pt-6 border-t border-[#E0F2F1]">
                                    <p className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-[0.2em] mb-4">Đánh giá tối thiểu</p>
                                    {[5, 4, 3].map(star => (
                                        <label key={star} className="flex items-center gap-3 mb-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="rating"
                                                checked={minRating === star}
                                                onChange={() => setMinRating(star)}
                                                className="w-4 h-4 border-[#E0F2F1] text-[#004D40] focus:ring-[#004D40] accent-[#004D40]"
                                            />
                                            <span className="flex items-center gap-1 text-sm font-bold text-[#004D40]/70">
                                                {star} <Star size={14} className="fill-[#FFAB40] text-[#FFAB40]" />
                                            </span>
                                        </label>
                                    ))}
                                    {minRating > 0 && (
                                        <button onClick={() => setMinRating(0)} className="text-xs text-[#26bed6] underline font-bold mt-2 hover:text-[#004D40]">Xóa lọc đánh giá</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* SERVICE GRID */}
                    <div className="lg:col-span-9 flex flex-col">

                        {services.length === 0 && !loading ? (
                            <div className="text-center py-20 bg-white rounded-[40px] border border-white shadow-sm">
                                <p className="text-[#004D40]/50 font-bold text-lg">Không tìm thấy dịch vụ nào phù hợp.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                {services.map((srv, idx) => {
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (idx % 6) * 0.1 }}
                                            key={srv._id} onClick={() => navigate(`/services/${srv._id}`)}
                                            className="bg-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-xl rounded-br-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group cursor-pointer border border-white flex flex-col"
                                        >
                                            <div className="h-64 relative overflow-hidden shrink-0">
                                                <img src={srv.thumbnail || srv.images?.[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={srv.name} />

                                                {/* Badge Khuyến mãi */}
                                                {srv.discount > 0 && (
                                                    <div className="absolute top-4 left-4 bg-[#D32F2F] text-white px-3 py-1 rounded-tr-xl rounded-bl-xl font-black text-xs shadow-md z-10">
                                                        -{srv.discount}%
                                                    </div>
                                                )}

                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                                                    <Star size={12} className="fill-[#FFAB40] text-[#FFAB40]" />
                                                    <span className="text-xs font-black text-[#004D40]">{srv.ratingStats?.averageRating?.toFixed(1) || "New"}</span>
                                                    <span className="text-[10px] text-gray-500">({srv.ratingStats?.totalReviews || 0})</span>
                                                </div>
                                                <div className="absolute bottom-4 left-4 bg-[#004D40]/80 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-tr-xl rounded-bl-xl uppercase tracking-widest z-10">
                                                    {srv.type}
                                                </div>
                                            </div>
                                            <div className="p-8 flex flex-col flex-1 justify-between">
                                                <div>
                                                    <div className="flex items-start gap-1.5 text-[#004D40]/40 mb-2">
                                                        <MapPin size={14} className="shrink-0 mt-0.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">{srv.address}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-cormorant font-bold text-[#004D40] mb-6 group-hover:text-[#FFAB40] transition-colors line-clamp-2" title={srv.name}>{srv.name}</h3>
                                                </div>
                                                <div className="flex items-end justify-between pt-6 border-t border-[#E0F2F1]">
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Bắt đầu từ</p>
                                                        {srv.discount > 0 && (
                                                            <p className="text-xs text-gray-400 line-through mb-0.5">{srv.pricePerUnit.toLocaleString('vi-VN')} đ</p>
                                                        )}
                                                        <p className={`text-xl font-black italic ${srv.discount > 0 ? 'text-[#D32F2F]' : 'text-[#004D40]'}`}>
                                                            {srv.finalPrice === 0 ? 'Miễn phí' : `${srv.finalPrice?.toLocaleString('vi-VN')} đ`}
                                                        </p>
                                                    </div>
                                                    <div className="w-12 h-12 bg-[#E0F2F1] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center text-[#004D40] group-hover:bg-[#FFAB40] group-hover:text-white transition-all">
                                                        <ChevronRight size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* LOADING SPINNER & NÚT XEM THÊM */}
                        {loading && (
                            <div className="flex justify-center py-6">
                                <div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {!loading && hasMore && (
                            <div className="text-center mt-4">
                                <button
                                    onClick={() => setPage(prev => prev + 1)}
                                    className="bg-white border-2 border-[#004D40] text-[#004D40] px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#004D40] hover:text-white transition-all shadow-md hover:shadow-xl"
                                >
                                    Tải thêm dịch vụ
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AllServices;