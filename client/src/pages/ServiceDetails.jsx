import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import {
    Star, Share2, Heart, Calendar, Users, Info, CheckCircle2, Camera, X, ChevronLeft, ChevronRight, Sparkles, Building, Umbrella,
    Waves, Dumbbell, Leaf, Utensils, Music, Baby, Wine, Mountain, Sunrise, Moon, Ticket, Briefcase, ArrowLeft, CarFront, MonitorSmartphone, ShieldCheck, MapPin, Clock, Coffee
} from 'lucide-react';

// ==========================================
// 1. TỪ ĐIỂN DỊCH ENUM SANG TIẾNG VIỆT & ICON
// ==========================================
const AMENITIES_DICT = {
    // 👥 Target Audience
    'FAMILY': { label: 'Gia đình', icon: <Users size={24} /> },
    'COUPLE': { label: 'Cặp đôi', icon: <Heart size={24} /> },
    'BUSINESS': { label: 'Công tác', icon: <Briefcase size={24} /> },
    'PET_FRIENDLY': { label: 'Thú cưng', icon: <Sparkles size={24} /> },
    'KID_SAFE': { label: 'An toàn cho bé', icon: <Baby size={24} /> },
    'SENIOR_FRIENDLY': { label: 'Người cao tuổi', icon: <ShieldCheck size={24} /> },
    'THRILL_SEEKER': { label: 'Mạo hiểm', icon: <Mountain size={24} /> },

    // 🏨 Hotel Details
    'LUXURY': { label: 'Cao cấp', icon: <Building size={24} /> },
    'MID_RANGE': { label: 'Tầm trung', icon: <Building size={24} /> },
    'BUDGET': { label: 'Tiết kiệm', icon: <Building size={24} /> },
    'BOUTIQUE': { label: 'Boutique', icon: <Building size={24} /> },
    'HOMESTAY': { label: 'Homestay', icon: <Building size={24} /> },
    'BEACHFRONT': { label: 'Giáp biển', icon: <Umbrella size={24} /> },
    'RIVERSIDE': { label: 'View sông', icon: <Waves size={24} /> },
    'CITY_CENTER': { label: 'Trung tâm', icon: <MapPin size={24} /> },
    'NEAR_AIRPORT': { label: 'Gần sân bay', icon: <MapPin size={24} /> },
    'INFINITY_POOL': { label: 'Hồ bơi vô cực', icon: <Waves size={24} /> },
    'ROOFTOP_BAR': { label: 'Rooftop Bar', icon: <Wine size={24} /> },
    'SPA_WELLNESS': { label: 'Spa & Massage', icon: <Leaf size={24} /> },
    'PRIVATE_BEACH': { label: 'Bãi biển riêng', icon: <Umbrella size={24} /> },
    'GYM_247': { label: 'Phòng Gym 24/7', icon: <Dumbbell size={24} /> },
    'MODERN': { label: 'Hiện đại', icon: <Sparkles size={24} /> },
    'CLASSIC': { label: 'Cổ điển', icon: <Sparkles size={24} /> },
    'ECO_FRIENDLY': { label: 'Thân thiện MT', icon: <Leaf size={24} /> },
    'MINIMALIST': { label: 'Tối giản', icon: <Sparkles size={24} /> },

    // 🍽️ Restaurant Details
    'LOCAL_FOOD': { label: 'Đặc sản', icon: <Utensils size={24} /> },
    'SEAFOOD': { label: 'Hải sản', icon: <Utensils size={24} /> },
    'FINE_DINING': { label: 'Fine Dining', icon: <Wine size={24} /> },
    'STREET_FOOD': { label: 'Đường phố', icon: <Utensils size={24} /> },
    'VEGAN': { label: 'Đồ chay', icon: <Leaf size={24} /> },
    'WESTERN': { label: 'Món Âu', icon: <Utensils size={24} /> },
    'ASIAN': { label: 'Món Á', icon: <Utensils size={24} /> },
    'BREAKFAST': { label: 'Ăn sáng', icon: <Sunrise size={24} /> },
    'BRUNCH': { label: 'Brunch', icon: <Coffee size={24} /> },
    'LUNCH': { label: 'Ăn trưa', icon: <Utensils size={24} /> },
    'DINNER': { label: 'Ăn tối', icon: <Moon size={24} /> },
    'LATE_NIGHT': { label: 'Ăn đêm', icon: <Moon size={24} /> },
    'OUTDOOR': { label: 'Ngoài trời', icon: <Umbrella size={24} /> },
    'PRIVATE_ROOM': { label: 'Phòng riêng', icon: <ShieldCheck size={24} /> },
    'ROMANTIC': { label: 'Lãng mạn', icon: <Heart size={24} /> },
    'RIVERSIDE_VIEW': { label: 'View sông', icon: <Waves size={24} /> },
    'CASUAL': { label: 'Thoải mái', icon: <Coffee size={24} /> },
    'LIVE_MUSIC': { label: 'Nhạc sống', icon: <Music size={24} /> },
    'KIDS_MENU': { label: 'Menu trẻ em', icon: <Baby size={24} /> },
    'CRAFT_BEER': { label: 'Bia thủ công', icon: <Wine size={24} /> },
    'WINE_CELLAR': { label: 'Hầm rượu', icon: <Wine size={24} /> },
    'HALAL': { label: 'Halal', icon: <Utensils size={24} /> },
    'GOOD_FOR_GROUPS': { label: 'Phù hợp nhóm', icon: <Users size={24} /> },
    'INSTAGRAMMABLE': { label: 'Góc sống ảo', icon: <Camera size={24} /> },
    'QUICK_BITES': { label: 'Ăn nhanh', icon: <Clock size={24} /> },

    // 🎟️ Activity Details
    'RELAXING': { label: 'Thư giãn', icon: <Leaf size={24} /> },
    'MODERATE': { label: 'Vừa phải', icon: <Waves size={24} /> },
    'HIGH_ENERGY': { label: 'Năng động', icon: <Mountain size={24} /> },
    'CULTURAL': { label: 'Văn hóa', icon: <Building size={24} /> },
    'NATURE_ADVENTURE': { label: 'Khám phá TN', icon: <Mountain size={24} /> },
    'ENTERTAINMENT': { label: 'Giải trí', icon: <Ticket size={24} /> },
    'WORKSHOP': { label: 'Workshop', icon: <Users size={24} /> },
    'NIGHTLIFE': { label: 'Về đêm', icon: <Moon size={24} /> },
    'SUNRISE': { label: 'Bình minh', icon: <Sunrise size={24} /> },
    'SUNSET': { label: 'Hoàng hôn', icon: <Sunrise size={24} /> },
    'NIGHT': { label: 'Buổi tối', icon: <Moon size={24} /> },
    'INDOOR': { label: 'Trong nhà', icon: <Building size={24} /> },
    'BA_NA_HILLS': { label: 'Bà Nà Hills', icon: <Mountain size={24} /> },
    'SON_TRA': { label: 'Sơn Trà', icon: <Mountain size={24} /> },
    'HOI_AN': { label: 'Hội An', icon: <Building size={24} /> },
    'MARBLE_MOUNTAIN': { label: 'Ngũ Hành Sơn', icon: <Mountain size={24} /> }
};

const ServiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken, userId } = useAuth();

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isBooking, setIsBooking] = useState(false);

    const [showLightbox, setShowLightbox] = useState(false);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState([]);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const res = await axios.get(`/api/services/${id}`);
                const data = res.data.data;
                setService(data);

                const actualImages = [];
                if (data.thumbnail) actualImages.push(data.thumbnail);
                if (data.images && data.images.length > 0) {
                    actualImages.push(...data.images);
                }
                setLightboxImages(actualImages.filter(Boolean));

            } catch (error) {
                toast.error('Không thể tải thông tin dịch vụ.');
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    // Trích xuất toàn bộ tiện ích từ CSDL (Dịch ENUM + Lọc trùng)
    const extractAllFeatures = () => {
        if (!service) return [];
        let mappedFeatures = [];

        // Hàm helper đệ quy để quét các ENUM
        const extractEnums = (source) => {
            if (!source) return;
            if (Array.isArray(source)) {
                source.forEach(key => {
                    if (AMENITIES_DICT[key]) mappedFeatures.push(AMENITIES_DICT[key]);
                });
            } else if (typeof source === 'string') {
                if (AMENITIES_DICT[source]) mappedFeatures.push(AMENITIES_DICT[source]);
            } else if (typeof source === 'object') {
                Object.values(source).forEach(val => extractEnums(val));
            }
        };

        // Quét các trường đặc thù
        extractEnums(service.targetAudience);
        extractEnums(service.hotelDetails);
        extractEnums(service.restaurantDetails);
        extractEnums(service.activityDetails);

        // Kéo mảng features (Tiện ích tự nhập bằng tiếng Việt, hoặc các ENUM bị lọt vào đây)
        const customFeatures = [];
        if (service.features) {
            service.features.forEach(feat => {
                // Nếu vô tình nó là ENUM thì dịch, nếu không thì in ra chữ gốc + icon mặc định
                if (AMENITIES_DICT[feat]) {
                    mappedFeatures.push(AMENITIES_DICT[feat]);
                } else {
                    customFeatures.push({ label: feat, icon: <Sparkles size={24} /> });
                }
            });
        }

        // Gộp và loại bỏ các tiện ích bị trùng tên (duplicate)
        const allFeatures = [...mappedFeatures, ...customFeatures];
        const uniqueFeatures = Array.from(new Map(allFeatures.map(item => [item.label, item])).values());

        return uniqueFeatures;
    };

    const calculateTotal = () => {
        if (!service) return 0;
        let days = 1;
        if (service.type === 'HOTEL' && checkInDate && checkOutDate) {
            const start = new Date(checkInDate);
            const end = new Date(checkOutDate);
            days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
        }
        return service.finalPrice * quantity * days;
    };

    const handleBooking = async () => {
        if (!userId) return toast.error('Vui lòng đăng nhập để thực hiện!');
        if (!checkInDate) return toast.error('Vui lòng chọn ngày!');
        if (service.type === 'HOTEL' && !checkOutDate) return toast.error('Vui lòng chọn ngày trả phòng!');
        if (service.type === 'HOTEL' && new Date(checkInDate) >= new Date(checkOutDate)) {
            return toast.error('Ngày trả phòng phải sau ngày nhận phòng!');
        }

        setIsBooking(true);
        try {
            const token = await getToken();
            const payload = {
                serviceId: service._id,
                checkInDate,
                checkOutDate: service.type === 'HOTEL' ? checkOutDate : checkInDate,
                quantity: Number(quantity),
                customerInfo: { fullName: "Nguyễn Văn Khách", phoneNumber: "0901234567", email: "test@ex.com" }
            };
            await axios.post('/api/bookings', payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Tạo đơn đặt chỗ thành công!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi đặt chỗ.');
        } finally {
            setIsBooking(false);
        }
    };

    const openLightbox = (index) => {
        const safeIndex = Math.min(index, lightboxImages.length - 1);
        setCurrentImgIndex(safeIndex);
        setShowLightbox(true);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin"></div></div>;
    if (!service) return <div className="text-center py-20">Không tìm thấy dịch vụ</div>;

    const bentoImages = Array(4).fill(null).map((_, i) => lightboxImages[i] || lightboxImages[0] || '');
    const featuresList = extractAllFeatures();

    const unitLabel = service.type === 'HOTEL' ? 'Số lượng phòng' : service.type === 'RESTAURANT' ? 'Số người' : 'Số vé';
    const actionLabel = service.type === 'HOTEL' ? 'Đặt phòng' : service.type === 'RESTAURANT' ? 'Đặt bàn' : 'Mua vé';
    const priceUnitLabel = service.type === 'HOTEL' ? '/ đêm' : service.type === 'RESTAURANT' ? '/ người' : '/ vé';
    const dateInputClasses = "w-full bg-[#F5F5F5] border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl pl-4 pr-12 py-4 outline-none focus:ring-2 focus:ring-[#FFAB40]/50 font-bold text-[#004D40] cursor-pointer relative z-10 bg-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer";

    // Xử lý tọa độ cho OpenStreetMap
    const lat = service.location?.coordinates?.[1] || 16.047079;
    const lng = service.location?.coordinates?.[0] || 108.206230;

    return (
        <div className="bg-[#F5F5F5] min-h-screen font-jakarta pt-28 pb-20 relative">

            <motion.button
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(-1)}
                className="fixed top-28 left-6 z-40 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg text-[#004D40] hover:text-[#FFAB40] hover:scale-110 transition-all hidden lg:flex border border-[#004D40]/10"
                title="Quay lại danh sách"
            >
                <ArrowLeft size={24} />
            </motion.button>

            <div className="max-w-7xl mx-auto px-6 lg:pl-24">

                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#004D40]/60 hover:text-[#004D40] font-bold text-sm mb-6 lg:hidden transition-colors">
                    <ArrowLeft size={16} /> Quay lại
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#004D40] text-[#FFAB40] px-4 py-1 rounded-tr-xl rounded-bl-xl text-[10px] font-black tracking-widest uppercase">
                                {service.type}
                            </span>
                            <div className="flex items-center gap-1 text-[#FFAB40]">
                                <Star size={14} className="fill-[#FFAB40]" />
                                <span className="text-sm font-black text-[#004D40]">
                                    {service.ratingStats?.averageRating || 5.0} ({service.ratingStats?.totalReviews || 0} đánh giá)
                                </span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-cormorant font-bold text-[#004D40] leading-tight max-w-4xl">{service.name}</h1>
                        <p className="flex items-center gap-2 text-[#004D40]/50 mt-4 font-bold text-sm uppercase tracking-widest">
                            <MapPin size={16} className="text-[#FFAB40]" /> {service.address}
                        </p>
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[550px] mb-16">
                    <div className="md:col-span-2 h-full rounded-tr-[60px] rounded-bl-[60px] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-2xl border-4 border-white cursor-pointer" onClick={() => openLightbox(0)}>
                        <img src={bentoImages[0]} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Main" />
                    </div>
                    <div className="md:col-span-1 grid grid-rows-2 gap-4 h-full">
                        <div className="rounded-tr-2xl rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl overflow-hidden border-2 border-white shadow-lg cursor-pointer" onClick={() => openLightbox(1)}>
                            <img src={bentoImages[1]} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 1" />
                        </div>
                        <div className="rounded-tr-[40px] rounded-bl-2xl rounded-tl-2xl rounded-br-2xl overflow-hidden border-2 border-white shadow-lg cursor-pointer" onClick={() => openLightbox(2)}>
                            <img src={bentoImages[2]} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 2" />
                        </div>
                    </div>
                    <div
                        className="md:col-span-1 h-full rounded-tr-2xl rounded-bl-2xl rounded-tl-[40px] rounded-br-[40px] overflow-hidden border-2 border-white shadow-lg relative group cursor-pointer"
                        onClick={() => openLightbox(3)}
                    >
                        <img src={bentoImages[3]} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 3" />
                        {lightboxImages.length > 4 && (
                            <div className="absolute inset-0 bg-[#004D40]/60 backdrop-blur-sm flex flex-col items-center justify-center text-white transition-all hover:bg-[#004D40]/80">
                                <Camera size={32} strokeWidth={1.5} />
                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">Xem {lightboxImages.length - 4} ảnh khác</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-12">
                        <section>
                            <h2 className="text-3xl font-cormorant font-bold text-[#004D40] mb-6 flex items-center gap-4">
                                <span className="w-12 h-px bg-[#FFAB40]"></span> Giới thiệu
                            </h2>
                            <p className="text-lg font-medium text-[#004D40]/70 leading-relaxed italic text-justify whitespace-pre-line">
                                {service.description}
                            </p>
                        </section>

                        <section className="bg-white p-8 md:p-12 rounded-tr-[50px] rounded-bl-[50px] rounded-tl-3xl rounded-br-3xl border border-white shadow-xl">
                            <h2 className="text-2xl font-cormorant font-bold text-[#004D40] mb-10 text-center uppercase tracking-widest">Đặc điểm & Tiện ích</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-10 gap-x-6">
                                {featuresList.length > 0 ? featuresList.map((item, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 group text-center">
                                        <div className="w-16 h-16 bg-[#F5F5F5] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center text-[#004D40] group-hover:bg-[#FFAB40] group-hover:text-white transition-all shadow-inner">
                                            {item.icon}
                                        </div>
                                        <span className="text-[10px] font-black text-[#004D40]/60 uppercase tracking-widest leading-snug px-2">{item.label}</span>
                                    </div>
                                )) : <p className="col-span-full text-center text-gray-400 font-medium">Chưa có thông tin tiện ích.</p>}
                            </div>
                        </section>

                        <section className="bg-white p-8 md:p-12 rounded-tr-[50px] rounded-bl-[50px] rounded-tl-3xl rounded-br-3xl border border-white shadow-xl">
                            <h2 className="text-2xl font-cormorant font-bold text-[#004D40] mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <MapPin className="text-[#FFAB40]" size={24} /> Vị trí trên bản đồ
                            </h2>
                            <div className="w-full h-[400px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-xl rounded-br-xl overflow-hidden border-4 border-[#F5F5F5]">
                                {/* HIỂN THỊ BẢN ĐỒ OPENSTREETMAP SẠCH SẼ (KHÔNG INPUT TÌM KIẾM) */}
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight="0"
                                    marginWidth="0"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                                    style={{ border: 0 }}
                                ></iframe>
                            </div>
                        </section>
                    </div>

                    <aside className="lg:col-span-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-28 bg-white/80 backdrop-blur-xl p-8 rounded-tr-[50px] rounded-bl-[50px] rounded-tl-2xl rounded-br-2xl border border-white shadow-2xl">
                            <div className="flex justify-between items-end mb-8 pb-6 border-b border-[#E0F2F1]">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá cơ sở</p>
                                    <h3 className="text-3xl font-black text-[#004D40] italic">{service.finalPrice.toLocaleString('vi-VN')} đ</h3>
                                </div>
                                <p className="text-xs font-bold text-[#004D40]/50 mb-1">{priceUnitLabel}</p>
                            </div>

                            <div className="space-y-6">
                                {service.type === 'HOTEL' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">Nhận phòng</label>
                                            <div className="relative group bg-[#F5F5F5] rounded-tr-xl rounded-bl-xl overflow-hidden">
                                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFAB40] pointer-events-none group-hover:scale-110 transition-transform" size={18} />
                                                <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={dateInputClasses} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">Trả phòng</label>
                                            <div className="relative group bg-[#F5F5F5] rounded-tr-xl rounded-bl-xl overflow-hidden">
                                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFAB40] pointer-events-none group-hover:scale-110 transition-transform" size={18} />
                                                <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} min={checkInDate || new Date().toISOString().split('T')[0]} className={dateInputClasses} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">Ngày tham gia</label>
                                        <div className="relative group bg-[#F5F5F5] rounded-tr-xl rounded-bl-xl overflow-hidden">
                                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFAB40] pointer-events-none group-hover:scale-110 transition-transform" size={18} />
                                            <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={dateInputClasses} />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">{unitLabel}</label>
                                    <div className="relative">
                                        <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFAB40]" size={18} />
                                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" className="w-full bg-[#F5F5F5] border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl p-4 pr-12 outline-none focus:ring-2 focus:ring-[#FFAB40]/50 font-bold text-[#004D40]" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center bg-[#F5F5F5] p-4 rounded-xl border border-[#E0F2F1]">
                                <span className="text-sm font-bold text-[#004D40]">Tổng tạm tính:</span>
                                <span className="text-xl font-black text-[#FFAB40]">{calculateTotal().toLocaleString('vi-VN')} đ</span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleBooking} disabled={isBooking}
                                className={`w-full text-white py-5 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-md rounded-br-md font-black text-sm uppercase tracking-[0.3em] mt-6 shadow-xl shadow-[#004D40]/20 flex items-center justify-center gap-3 transition-all ${isBooking ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004D40] hover:bg-[#002B24]'}`}
                            >
                                <CheckCircle2 size={18} /> {isBooking ? 'Đang xử lý...' : actionLabel}
                            </motion.button>
                        </motion.div>
                    </aside>
                </div>
            </div>

            {/* LIGHTBOX SLIDER MODAL */}
            <AnimatePresence>
                {showLightbox && lightboxImages.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center">
                        <button onClick={() => setShowLightbox(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full z-50">
                            <X size={32} />
                        </button>

                        {lightboxImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev === 0 ? lightboxImages.length - 1 : prev - 1); }}
                                    className="absolute left-4 md:left-10 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 md:p-4 rounded-full transition-all hover:scale-110 z-50"
                                >
                                    <ChevronLeft size={32} />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev === lightboxImages.length - 1 ? 0 : prev + 1); }}
                                    className="absolute right-4 md:right-10 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 md:p-4 rounded-full transition-all hover:scale-110 z-50"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </>
                        )}

                        <motion.img
                            key={currentImgIndex}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
                            src={lightboxImages[currentImgIndex]}
                            className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl select-none"
                            alt={`Gallery ${currentImgIndex + 1}`}
                        />

                        {lightboxImages.length > 1 && (
                            <div className="absolute bottom-6 text-white/70 font-bold tracking-widest text-sm bg-black/50 px-6 py-2 rounded-full border border-white/10">
                                {currentImgIndex + 1} / {lightboxImages.length}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ServiceDetails;