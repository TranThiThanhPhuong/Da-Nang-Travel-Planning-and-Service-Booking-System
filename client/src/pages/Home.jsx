import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Calendar, Utensils, Bed, Ticket, ArrowRight, Star, Sparkles, ChevronDown, Filter, Crown, ChevronLeft, ChevronRight, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from 'axios';
import LoginPrompt from "../components/LoginPrompt";

const Home = ({ dbUser }) => {
    const navigate = useNavigate()
    const { isSignedIn } = useUser();
    const { getToken } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const [searchType, setSearchType] = useState('ALL')
    const [searchKeyword, setSearchKeyword] = useState('')
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const typeRef = useRef(null);

    const sliderRef = useRef(null);
    const aiSliderRef = useRef(null);

    const [premiumServices, setPremiumServices] = useState([]);
    const [isLoadingPremium, setIsLoadingPremium] = useState(true);

    const [aiServices, setAiServices] = useState([]);
    const [isLoadingAI, setIsLoadingAI] = useState(true);

    const handleAIPlannerClick = () => {
        if (!isSignedIn) {
            setShowLoginPrompt(true);
        } else {
            navigate("/ai-planner");
        }
    };

    // HÀM TÌM KIẾM CẬP NHẬT: LƯU TỪ KHÓA TRƯỚC KHI CHUYỂN TRANG
    const handleSearchNavigate = async (type = searchType, keyword = searchKeyword) => {
        // Lưu từ khóa ngầm dưới nền nếu đã đăng nhập và có nhập chữ
        if (isSignedIn && keyword.trim().length > 1) {
            try {
                const token = await getToken();
                // Chạy bất đồng bộ, không cần await block luồng chuyển trang
                axios.post('/api/users/save-search',
                    { keyword: keyword.trim() },
                    { headers: { Authorization: `Bearer ${token}` } }
                ).catch(err => console.error("Lỗi lưu lịch sử tìm kiếm", err));
            } catch (error) {
                console.error("Lỗi lấy token", error);
            }
        }

        const params = new URLSearchParams();
        if (type && type !== 'ALL') params.append('type', type);
        if (keyword.trim()) params.append('keyword', keyword.trim());

        navigate(`/services?${params.toString()}`);
    }

    const scrollSlider = (direction, ref) => {
        if (ref.current) {
            const scrollAmount = 350;
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const serviceTypes = [
        { id: 'HOTEL', label: 'Lưu trú', icon: <Bed size={18} />, color: 'bg-blue-500' },
        { id: 'RESTAURANT', label: 'Ẩm thực', icon: <Utensils size={18} />, color: 'bg-orange-500' },
        { id: 'ACTIVITY', label: 'Hoạt động', icon: <Ticket size={18} />, color: 'bg-teal-500' },
    ]

    // Gọi API kéo dữ liệu Banner VIP
    useEffect(() => {
        const fetchPremiumBanners = async () => {
            try {
                const res = await axios.get('/api/services/premium-banners');
                if (res.data.success) {
                    setPremiumServices(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi khi tải banner cao cấp:", error);
            } finally {
                setIsLoadingPremium(false);
            }
        };
        fetchPremiumBanners();
    }, []);

    // GỌI API KÉO DỮ LIỆU AI GỢI Ý (Chỉ chạy khi đã đăng nhập)
    useEffect(() => {
        const fetchAIRecommendations = async () => {
            if (!isSignedIn) {
                setIsLoadingAI(false);
                return;
            }
            try {
                const token = await getToken();
                const res = await axios.get('/api/services/recommendations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setAiServices(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi khi tải AI recommendations:", error);
            } finally {
                setIsLoadingAI(false);
            }
        };
        fetchAIRecommendations();
    }, [isSignedIn, getToken]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (typeRef.current && !typeRef.current.contains(event.target)) {
                setIsTypeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const typeOptions = [
        { id: 'ALL', label: 'Tất cả dịch vụ', icon: <Sparkles size={16} /> },
        { id: 'HOTEL', label: 'Khách sạn & Homestay', icon: <Bed size={16} /> },
        { id: 'RESTAURANT', label: 'Nhà hàng & Đặc sản', icon: <Utensils size={16} /> },
        { id: 'ACTIVITY', label: 'Tour & Trải nghiệm', icon: <Ticket size={16} /> },
    ]

    const currentTypeOption = typeOptions.find(opt => opt.id === searchType) || typeOptions[0];

    return (
        <div className="bg-[#F5F5F5] min-h-screen font-jakarta">

            {isSignedIn && dbUser && (
                <div className="absolute rounded-tr-[32px] rounded-bl-[32px] top-24 left-6 z-30 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white text-xs font-bold shadow-lg">
                    Chào mừng trở lại, {dbUser.fullName || "bạn đồng hành"}! ✨
                </div>
            )}

            {/* HERO PULSE SECTION */}
            <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1920&q=80" className="w-full h-full object-cover" alt="Danang" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#004D40]/70 via-[#004D40]/30 to-[#F5F5F5]"></div>
                </div>

                <div className="relative z-10 w-full max-w-5xl px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-8xl font-cormorant font-bold text-white mb-6 tracking-tight"
                    >
                        Nhịp đập <span className="text-[#FFAB40] italic font-medium text-4xl md:text-7xl">miền Di sản</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-xl p-2 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/20 shadow-2xl max-w-4xl mx-auto mt-12"
                    >
                        <div className="bg-white rounded-tr-[32px] rounded-bl-[32px] rounded-tl-xl rounded-br-xl p-2 flex flex-col md:flex-row gap-2">
                            <div className="flex-1 px-6 py-3 border-r border-gray-100 flex flex-col items-start justify-center relative" ref={typeRef}>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bạn tìm gì?</p>
                                <button
                                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                                    className="w-full flex items-center justify-between bg-[#004D40]/5 hover:bg-[#004D40]/10 text-[#004D40] font-bold text-sm px-4 py-2.5 rounded-tr-xl rounded-bl-xl transition-all outline-none"
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-[#FFAB40]">{currentTypeOption.icon}</span>
                                        <span className="tracking-wide text-gray-800">{currentTypeOption.label}</span>
                                    </div>
                                    <ChevronDown size={16} className={`text-[#004D40]/50 transition-transform duration-300 ${isTypeOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isTypeOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
                                            className="absolute top-[105%] left-6 right-6 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                                        >
                                            {typeOptions.map((option) => (
                                                <div
                                                    key={option.id}
                                                    onClick={() => {
                                                        setSearchType(option.id);
                                                        setIsTypeOpen(false);
                                                    }}
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm font-bold transition-all ${searchType === option.id ? 'bg-[#004D40]/5 text-[#FFAB40]' : 'text-gray-700 hover:bg-gray-50 hover:text-[#004D40]'}`}
                                                >
                                                    <span className={searchType === option.id ? 'text-[#FFAB40]' : 'text-[#004D40]/40'}>{option.icon}</span>
                                                    <span>{option.label}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex-1 px-6 py-3 border-r border-gray-100 flex flex-col items-start justify-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ở đâu?</p>
                                <div className="flex items-center gap-2 w-full">
                                    <MapPin size={14} className="text-[#FFAB40]" />
                                    <input
                                        type="text"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchNavigate()}
                                        placeholder="Khu vực, tên dịch vụ..."
                                        className="w-full bg-transparent font-bold text-[#004D40] outline-none placeholder-gray-300"
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleSearchNavigate()}
                                className="bg-[#004D40] text-white px-10 py-4 rounded-tr-[28px] rounded-bl-[28px] rounded-tl-lg rounded-br-lg font-bold flex items-center justify-center gap-2 hover:bg-[#00332A] transition-all shadow-lg"
                            >
                                <Search size={20} /> KHÁM PHÁ
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CATEGORY QUICK LINKS */}
            <section className="py-10 px-6 max-w-7xl mx-auto -mt-16 relative z-20">
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                    {serviceTypes.map((type) => (
                        <motion.div
                            key={type.id} whileHover={{ y: -5 }}
                            onClick={() => handleSearchNavigate(type.id, '')}
                            className="bg-white p-6 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl shadow-xl flex flex-col items-center justify-center gap-3 cursor-pointer group border border-white"
                        >
                            <div className={`${type.color} text-white p-4 rounded-tr-2xl rounded-bl-2xl shadow-lg group-hover:rotate-12 transition-transform`}>
                                {type.icon}
                            </div>
                            <span className="font-bold text-[#004D40] text-sm uppercase tracking-widest">{type.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* AI RECOMMENDATIONS SLIDER SECTION */}
            {isSignedIn && !isLoadingAI && aiServices.length > 0 && (
                <section className="py-12 px-6 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-cormorant font-bold text-[#004D40] flex items-center gap-3">
                                Dành riêng cho bạn <Bot className="text-[#FFAB40]" size={28} />
                            </h2>
                            <p className="text-gray-500 font-medium mt-2">Dựa trên sở thích và thói quen tìm kiếm của bạn gần đây.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => scrollSlider('left', aiSliderRef)} className="p-2 rounded-full bg-[#004D40] text-white hover:bg-[#FFAB40] transition-colors shadow-lg">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => scrollSlider('right', aiSliderRef)} className="p-2 rounded-full bg-[#004D40] text-white hover:bg-[#FFAB40] transition-colors shadow-lg">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={aiSliderRef}
                        className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
                    >
                        {aiServices.map((service, index) => (
                            <motion.div
                                key={`ai-${service._id}`}
                                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/services/${service._id}`)}
                                className="min-w-[300px] md:min-w-[350px] bg-white rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer snap-start group transition-all duration-300 flex flex-col relative"
                            >
                                <div className="absolute top-4 left-4 bg-gradient-to-r from-[#00695C] to-[#004D40] text-white px-3 py-1 rounded-tr-xl rounded-bl-xl font-black text-[10px] uppercase tracking-widest shadow-md z-10 flex items-center gap-1.5">
                                    <Sparkles size={12} /> Đề xuất
                                </div>

                                <div className="relative h-52 overflow-hidden">
                                    <img src={service.thumbnail} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-sm text-[#004D40] font-black px-3 py-1.5 rounded-lg text-sm shadow-md">
                                            {service.finalPrice === 0 ? 'Miễn phí' : `${service.finalPrice?.toLocaleString('vi-VN')} đ`}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-[#004D40] line-clamp-2 leading-snug group-hover:text-[#FFAB40] transition-colors">
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5 line-clamp-2 flex-1">
                                        <MapPin size={14} className="text-[#FFAB40] mt-0.5 shrink-0" />
                                        {service.address}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* PREMIUM BANNERS SLIDER SECTION */}
            {!isLoadingPremium && premiumServices.length > 0 && (
                <section className="py-12 px-6 max-w-7xl mx-auto border-t border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-cormorant font-bold text-[#004D40] flex items-center gap-3">
                                Tuyệt tác Điểm đến <Sparkles className="text-[#FFAB40]" size={28} />
                            </h2>
                            <p className="text-gray-500 font-medium mt-2">Tuyển tập những dịch vụ đẳng cấp nhất được đề xuất riêng cho bạn.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => scrollSlider('left', sliderRef)} className="p-2 rounded-full bg-[#004D40] text-white hover:bg-[#FFAB40] transition-colors shadow-lg">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => scrollSlider('right', sliderRef)} className="p-2 rounded-full bg-[#004D40] text-white hover:bg-[#FFAB40] transition-colors shadow-lg">
                                <ChevronRight size={20} />
                            </button>
                            <div className="h-6 w-[1px] bg-gray-300 mx-2"></div>
                            <button onClick={() => handleSearchNavigate('ALL', '')} className="text-[#004D40] font-bold text-sm flex items-center gap-2 hover:text-[#FFAB40] transition-colors">
                                Xem tất cả <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={sliderRef}
                        className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
                    >
                        {premiumServices.map((service, index) => (
                            <motion.div
                                key={service._id}
                                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/services/${service._id}`)}
                                className="min-w-[300px] md:min-w-[350px] bg-white rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer snap-start group transition-all duration-300 flex flex-col relative"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <img src={service.thumbnail} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                        <Crown size={14} /> Đề xuất VIP
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-sm text-[#004D40] font-black px-3 py-1.5 rounded-lg text-sm shadow-md">
                                            {service.finalPrice?.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-[#004D40] line-clamp-2 leading-snug group-hover:text-[#FFAB40] transition-colors">
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5 line-clamp-2 flex-1">
                                        <MapPin size={14} className="text-[#FFAB40] mt-0.5 shrink-0" />
                                        {service.address}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* AI CALL TO ACTION */}
            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-gray-200">
                <div className="bg-[#004D40] rounded-tr-[60px] rounded-bl-[60px] p-10 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFAB40]/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-[#FFAB40]/20 text-[#FFAB40] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                            <Sparkles size={14} /> AI Trip Planner
                        </div>
                        <h2 className="text-4xl md:text-6xl font-cormorant font-bold text-white leading-tight">
                            Lên lịch trình riêng <br /><span className="text-[#FFAB40] italic">cho trái tim bạn.</span>
                        </h2>
                        <p className="text-[#E0F2F1]/70 mt-6 font-medium max-w-lg">
                            Để Gemini AI của D-Pulse sắp xếp kỳ nghỉ hoàn hảo tại Đà Nẵng dựa trên ngân sách và sở thích của bạn.
                        </p>
                        <button
                            onClick={handleAIPlannerClick}
                            className="mt-10 bg-[#FFAB40] text-white px-8 py-4 rounded-tr-2xl rounded-bl-2xl font-bold flex items-center gap-3 hover:bg-[#e09635] transition-all shadow-lg shadow-[#FFAB40]/20 uppercase text-sm tracking-widest"
                        >
                            Bắt đầu ngay <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* Bảng minh họa timeline */}
                    <div className="flex-1 w-full max-w-md bg-white/10 backdrop-blur-xl rounded-tr-[40px] rounded-bl-[40px] p-6 border border-white/20 shadow-inner relative group">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#FFAB40]/10 rounded-full blur-2xl group-hover:bg-[#FFAB40]/20 transition-all duration-700"></div>
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                            <span className="text-xs font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={12} className="text-[#FFAB40] animate-pulse" /> Gợi ý từ Gemini AI
                            </span>
                            <span className="text-[10px] font-bold text-[#FFAB40] bg-[#FFAB40]/10 px-2 py-0.5 rounded-md border border-[#FFAB40]/20">
                                3 Ngày 2 Đêm
                            </span>
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[18px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#FFAB40] before:via-[#FFAB40]/40 before:to-transparent">

                            <motion.div whileHover={{ x: 4 }} className="flex gap-4 items-start relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-blue-500 border border-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                                    <Bed size={16} />
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-tr-xl rounded-bl-xl p-3 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">09:00 • Nhận phòng</span>
                                    <h4 className="text-sm font-bold text-white mt-0.5">Balcona Hotel Da Nang</h4>
                                    <p className="text-xs text-[#E0F2F1]/60 mt-1 line-clamp-1">Võ Nguyên Giáp, Ngũ Hành Sơn</p>
                                </div>
                            </motion.div>

                            <motion.div whileHover={{ x: 4 }} className="flex gap-4 items-start relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-orange-500 border border-orange-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                                    <Utensils size={16} />
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-tr-xl rounded-bl-xl p-3 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider">12:30 • Ẩm thực</span>
                                    <h4 className="text-sm font-bold text-white mt-0.5">Mỳ Quảng Ếch Bếp Trang</h4>
                                    <p className="text-xs text-[#E0F2F1]/60 mt-1 line-clamp-1">Lê Hồng Phong, Hải Châu</p>
                                </div>
                            </motion.div>

                            <motion.div whileHover={{ x: 4 }} className="flex gap-4 items-start relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-teal-500 border border-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 shrink-0">
                                    <Ticket size={16} />
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-tr-xl rounded-bl-xl p-3 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-wider">15:30 • Trải nghiệm</span>
                                    <h4 className="text-sm font-bold text-white mt-0.5">Khám phá Bán Đảo Sơn Trà</h4>
                                    <p className="text-xs text-[#E0F2F1]/60 mt-1 line-clamp-1">Chùa Linh Ứng & Đỉnh Bàn Cờ</p>
                                </div>
                            </motion.div>

                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#004D40] to-transparent rounded-bl-[40px] pointer-events-none"></div>
                    </div>
                </div>
            </section>

            <LoginPrompt
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                message="Đăng nhập để sử dụng AI Trip Planner và tạo lịch trình du lịch thông minh cho riêng bạn!"
            />
        </div>
    )
}

export default Home