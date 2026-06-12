import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth, useUser } from '@clerk/clerk-react'; // Nhập thêm useUser
import {
    Star, Share2, Heart, Users, User, Info, CheckCircle2, Camera, X, ChevronLeft, ChevronRight, Sparkles, Building, Umbrella,
    Waves, Dumbbell, Leaf, Utensils, Music, Baby, Wine, Mountain, Sunrise, Moon, Ticket, Briefcase, ArrowLeft, CarFront, MonitorSmartphone, ShieldCheck, MapPin, Clock, Coffee, Calendar, Mail
} from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import ServiceReviews from './ServiceReviews';

// =========================================================================
// 1. TỪ ĐIỂN MÃ HÓA ENUM SANG TIẾNG VIỆT & BIỂU TƯỢNG (AMENITIES_DICT)
// =========================================================================
const AMENITIES_DICT = {
    'FAMILY': { label: 'Gia đình', icon: <Users size={24} /> },
    'COUPLE': { label: 'Cặp đôi', icon: <Heart size={24} /> },
    'BUSINESS': { label: 'Công tác', icon: <Briefcase size={24} /> },
    'PET_FRIENDLY': { label: 'Thú cưng', icon: <Sparkles size={24} /> },
    'KID_SAFE': { label: 'An toàn cho bé', icon: <Baby size={24} /> },
    'SENIOR_FRIENDLY': { label: 'Người cao tuổi', icon: <ShieldCheck size={24} /> },
    'THRILL_SEEKER': { label: 'Mạo hiểm', icon: <Mountain size={24} /> },

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

// =========================================================================
// 2. COMPONENT CHÍNH (SERVICE DETAILS)
// =========================================================================
const ServiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { getToken, userId } = useAuth(); // userId của Clerk
    const { user } = useUser(); // Lấy data chi tiết của user đang đăng nhập (chứa email)

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [quantity, setQuantity] = useState(1);

    const [availableSlots, setAvailableSlots] = useState(null);
    const [showOwnerModal, setShowOwnerModal] = useState(false);

    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custEmail, setCustEmail] = useState('');
    const [custNote, setCustNote] = useState('');

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: null,
    });

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`/api/reviews/service/${id}`);
                if (res.data.success) {
                    setReviews(res.data.data || []);
                }
            } catch (error) {
                console.error("Lỗi khi tải đánh giá dịch vụ:", error);
            } finally {
                setLoadingReviews(false);
            }
        };

        if (id) {
            fetchReviews();
        }
    }, [id]);

    const [showLightbox, setShowLightbox] = useState(false);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState([]);

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const checkWishlistStatus = async () => {
            if (!userId) return;
            try {
                const token = await getToken();
                const res = await axios.get('/api/wishlists/my-wishlists', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const savedList = res.data.data;
                const isFound = savedList.some(item => item._id === id);
                setIsSaved(isFound);
            } catch (error) {
                console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
            }
        };
        checkWishlistStatus();
    }, [id, userId]);

    useEffect(() => {
        const checkInventory = async () => {
            if (!checkInDate || !service) return;
            if (service.type === 'HOTEL' && !checkOutDate) return;

            try {
                const outDate = service.type === 'HOTEL' ? checkOutDate : checkInDate;
                const res = await axios.get(`/api/services/${id}/inventory`, {
                    params: { checkInDate, checkOutDate: outDate }
                });
                if (res.data.success) {
                    setAvailableSlots(res.data.data.availableSlots);
                }
            } catch (error) {
                setAvailableSlots(null);
            }
        };
        checkInventory();
    }, [checkInDate, checkOutDate, id, service]);

    const handleWishlistToggle = async () => {
        if (!userId) {
            return setModalConfig({
                isOpen: true,
                type: 'warning',
                title: 'Yêu cầu đăng nhập',
                message: 'Bạn cần đăng nhập vào hệ thống để lưu dịch vụ này vào danh sách yêu thích.',
            });
        }

        try {
            const token = await getToken();
            const res = await axios.post('/api/wishlists/toggle',
                { serviceId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsSaved(res.data.data.isSaved);
            toast.success(res.data.message);
        } catch (error) {
            toast.error('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: service?.name || 'Dịch vụ tại D-Pulse',
                    url: window.location.href
                });
            } catch (err) {
                console.log('Hủy chia sẻ', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Đã copy đường dẫn vào bộ nhớ tạm!");
        }
    };

    const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

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

    const extractAllFeatures = () => {
        if (!service) return [];
        let mappedFeatures = [];

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

        extractEnums(service.targetAudience);
        extractEnums(service.hotelDetails);
        extractEnums(service.restaurantDetails);
        extractEnums(service.activityDetails);

        const customFeatures = [];
        if (service.features) {
            service.features.forEach(feat => {
                if (AMENITIES_DICT[feat]) {
                    mappedFeatures.push(AMENITIES_DICT[feat]);
                } else {
                    customFeatures.push({ label: feat, icon: <Sparkles size={24} /> });
                }
            });
        }

        const allFeatures = [...mappedFeatures, ...customFeatures];
        return Array.from(new Map(allFeatures.map(item => [item.label, item])).values());
    };

    const calculateTotal = () => {
        if (!service) return 0;
        let days = 1;
        if (service.type === 'HOTEL' && checkInDate && checkOutDate) {
            const start = new Date(checkInDate);
            const end = new Date(checkOutDate);
            days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
        }
        return service.finalPrice * Math.max(1, Number(quantity)) * days;
    };

    const handleCheckInChange = (e) => {
        const newCheckIn = e.target.value;
        setCheckInDate(newCheckIn);

        if (!checkOutDate || new Date(newCheckIn) >= new Date(checkOutDate)) {
            const nextDay = new Date(newCheckIn);
            nextDay.setDate(nextDay.getDate() + 1);
            setCheckOutDate(nextDay.toISOString().split('T')[0]);
        }
    };

    const getMinCheckOutDate = () => {
        if (!checkInDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        const minDate = new Date(checkInDate);
        minDate.setDate(minDate.getDate() + 1);
        return minDate.toISOString().split('T')[0];
    };

    const handleBookingClick = () => {
        if (!userId) {
            return setModalConfig({ isOpen: true, type: 'warning', title: 'Yêu cầu đăng nhập', message: 'Bạn cần đăng nhập vào hệ thống để có thể đặt dịch vụ này.' });
        }
        if (!checkInDate) {
            return setModalConfig({ isOpen: true, type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn ngày đặt dịch vụ.' });
        }
        if (service.type === 'HOTEL' && !checkOutDate) {
            return setModalConfig({ isOpen: true, type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn ngày trả phòng.' });
        }
        if (service.type === 'HOTEL' && new Date(checkInDate) >= new Date(checkOutDate)) {
            return setModalConfig({ isOpen: true, type: 'error', title: 'Ngày không hợp lệ', message: 'Ngày trả phòng phải sau ngày nhận phòng!' });
        }
        if (!quantity || Number(quantity) < 1) {
            return setModalConfig({ isOpen: true, type: 'warning', title: 'Số lượng không hợp lệ', message: 'Vui lòng nhập số lượng tối thiểu là 1.' });
        }
        if (!custName.trim()) {
            return setModalConfig({ isOpen: true, type: 'warning', title: 'Thiếu thông tin khách hàng', message: 'Vui lòng điền họ và tên người liên hệ nhận phòng/dịch vụ.' });
        }
        if (!custPhone.trim() || !/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(custPhone.trim())) {
            return setModalConfig({ isOpen: true, type: 'warning', title: 'Số điện thoại không hợp lệ', message: 'Vui lòng nhập số điện thoại liên hệ chính xác (gồm 10 chữ số).' });
        }
        if (!custEmail.trim() || !/^\S+@\S+\.\S+$/.test(custEmail.trim())) {
            return setModalConfig({ isOpen: true, type: 'warning', title: 'Email không hợp lệ', message: 'Vui lòng điền chính xác địa chỉ Email để hệ thống gửi hóa đơn điện tử.' });
        }

        const totalAmount = calculateTotal();
        setModalConfig({
            isOpen: true,
            type: 'confirm',
            title: 'Xác nhận đặt dịch vụ',
            message: `Bạn chuẩn bị ${actionLabel.toLowerCase()} cho ${quantity} ${unitLabel.toLowerCase().replace('số ', '')} dưới tên khách hàng "${custName.trim()}" với tổng tiền là ${totalAmount.toLocaleString('vi-VN')} đ. Tiến hành thanh toán chứ?`,
            onConfirm: executeBooking
        });
    };

    const executeBooking = async () => {
        setModalConfig({
            isOpen: true, type: 'loading', title: 'Đang xử lý giao dịch...',
            message: 'Hệ thống đang kiểm tra kho và kết nối cổng thanh toán. Vui lòng không đóng trình duyệt lúc này.',
        });

        try {
            const token = await getToken();
            const payload = {
                serviceId: service._id,
                checkInDate,
                checkOutDate: service.type === 'HOTEL' ? checkOutDate : checkInDate,
                quantity: Number(quantity),
                customerInfo: { fullName: custName.trim(), phoneNumber: custPhone.trim(), email: custEmail.trim(), note: custNote.trim() || undefined },
            };

            const bookingRes = await axios.post('/api/bookings', payload, { headers: { Authorization: `Bearer ${token}` } });
            const paymentRes = await axios.post('/api/payments/create-link', { bookingId: bookingRes.data.data._id }, { headers: { Authorization: `Bearer ${token}` } });

            if (paymentRes.data.data.checkoutUrl) {
                window.location.href = paymentRes.data.data.checkoutUrl;
            } else {
                throw new Error('Không lấy được link từ PayOS');
            }
        } catch (error) {
            setModalConfig({
                isOpen: true, type: 'error', title: 'Đặt dịch vụ thất bại',
                message: error.response?.data?.message || 'Đã xảy ra lỗi không xác định từ hệ thống. Vui lòng thử lại sau.',
            });
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

    const dateInputClasses = "w-full bg-transparent border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl pl-2 pr-8 py-3 outline-none focus:ring-2 focus:ring-[#FFAB40]/50 font-bold text-sm tracking-tighter text-[#004D40] cursor-pointer relative z-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer";

    const lat = service.location?.coordinates?.[1] || 16.047079;
    const lng = service.location?.coordinates?.[0] || 108.206230;

    const currentUserEmail = user?.primaryEmailAddress?.emailAddress;
    const ownerEmail = service?.ownerId?.email;
    const ownerClerkId = service?.ownerId?.clerkId;

    const isOwnerOfService = Boolean(
        (userId && ownerClerkId && userId === ownerClerkId) ||
        (currentUserEmail && ownerEmail && currentUserEmail === ownerEmail)
    );

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
                                {service.ratingStats?.totalReviews > 0 ? (
                                    <>
                                        <Star size={14} className="fill-[#FFAB40]" />
                                        <span className="text-sm font-black text-[#004D40]">
                                            {service.ratingStats?.averageRating || 5.0} ({service.ratingStats?.totalReviews} đánh giá)
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-sm font-black text-[#004D40] opacity-50">0 đánh giá</span>
                                )}
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-cormorant font-bold text-[#004D40] leading-tight max-w-4xl">{service.name}</h1>
                        <p className="flex items-center gap-2 text-[#004D40]/50 mt-4 font-bold text-sm uppercase tracking-widest">
                            <MapPin size={16} className="text-[#FFAB40]" /> {service.address}
                        </p>

                        {/* WIDGET CHỦ SỞ HỮU MỚI (CLICK ĐỂ MỞ POP-UP) */}
                        {service.ownerId && (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowOwnerModal(true)}
                                className="mt-6 inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm p-2 pr-6 rounded-full shadow-sm border border-white cursor-pointer hover:shadow-md transition-all"
                            >
                                <img src={service.ownerId.avatar || 'https://via.placeholder.com/150'} alt={service.ownerId.fullName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Đăng bởi đối tác</p>
                                    <p className="text-sm font-bold text-[#004D40] leading-none mt-0.5">{service.ownerId.fullName}</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <button onClick={handleShare} className="p-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-full shadow-md text-[#004D40] transition-colors" title="Chia sẻ dịch vụ">
                            <Share2 size={20} />
                        </button>

                        <button
                            onClick={handleWishlistToggle}
                            className="p-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-full shadow-md transition-colors"
                            title={isSaved ? "Xóa khỏi danh sách yêu thích" : "Lưu vào danh sách yêu thích"}
                        >
                            <Heart size={20} className={isSaved ? "fill-red-500 text-red-500 animate-pulse" : "text-[#004D40]"} />
                        </button>
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-[250px] lg:auto-rows-auto lg:h-[500px] mb-16">
                    <div className="lg:col-span-2 h-[300px] lg:h-full rounded-tr-[60px] rounded-bl-[60px] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-2xl border-4 border-white cursor-pointer relative" onClick={() => openLightbox(0)}>
                        <img src={bentoImages[0]} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Main" />
                    </div>

                    <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4 h-[150px] lg:h-full">
                        <div className="rounded-tr-2xl rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl overflow-hidden border-2 border-white shadow-lg cursor-pointer relative" onClick={() => openLightbox(1)}>
                            <img src={bentoImages[1]} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 1" />
                        </div>
                        <div className="rounded-tr-[40px] rounded-bl-2xl rounded-tl-2xl rounded-br-2xl overflow-hidden border-2 border-white shadow-lg cursor-pointer relative" onClick={() => openLightbox(2)}>
                            <img src={bentoImages[2]} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 2" />
                        </div>
                    </div>

                    <div className="lg:col-span-1 h-[300px] lg:h-full rounded-tr-2xl rounded-bl-2xl rounded-tl-[40px] rounded-br-[40px] overflow-hidden border-2 border-white shadow-lg relative group cursor-pointer" onClick={() => openLightbox(3)}>
                        <img src={bentoImages[3]} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Sub 3" />
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
                                <iframe
                                    width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                                    style={{ border: 0 }}
                                ></iframe>
                            </div>
                            <p className="text-sm font-bold text-[#004D40] mt-5 text-center px-4">
                                {service.address}
                            </p>
                        </section>
                    </div>

                    <aside className="lg:col-span-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-28 bg-white/80 backdrop-blur-xl p-8 rounded-tr-[50px] rounded-bl-[50px] rounded-tl-2xl rounded-br-2xl border border-white shadow-2xl">

                            <div className="flex flex-col mb-8 pb-6 border-b border-[#E0F2F1]">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá cơ sở</p>
                                <div className="flex justify-between items-end w-full">
                                    <div>
                                        {service && service.discount > 0 && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm line-through text-gray-400 font-medium">
                                                    {service.price ? service.price.toLocaleString('vi-VN') : (service.finalPrice / (1 - service.discount / 100)).toLocaleString('vi-VN')} đ
                                                </span>
                                                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                                                    -{service.discount}%
                                                </span>
                                            </div>
                                        )}
                                        <h3 className="text-3xl font-black text-[#004D40] italic">{service && service.finalPrice.toLocaleString('vi-VN')} đ</h3>
                                    </div>
                                    <p className="text-xs font-bold text-[#004D40]/50 mb-1">{priceUnitLabel}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {service && service.type === 'HOTEL' ? (
                                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">Nhận phòng</label>
                                            <div className="relative group bg-[#F5F5F5] rounded-tr-xl rounded-bl-xl overflow-hidden">
                                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFAB40] pointer-events-none group-hover:scale-110 transition-transform" size={16} />
                                                <input type="date" value={checkInDate} onChange={handleCheckInChange} min={new Date().toISOString().split('T')[0]} className={dateInputClasses} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">Trả phòng</label>
                                            <div className="relative group bg-[#F5F5F5] rounded-tr-xl rounded-bl-xl overflow-hidden">
                                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFAB40] pointer-events-none group-hover:scale-110 transition-transform" size={16} />
                                                <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} min={getMinCheckOutDate()} className={dateInputClasses} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">Ngày tham gia</label>
                                        <div className="relative group bg-[#F5F5F5] rounded-tr-xl rounded-bl-xl overflow-hidden">
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFAB40] pointer-events-none group-hover:scale-110 transition-transform" size={16} />
                                            <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={dateInputClasses} />
                                        </div>
                                    </div>
                                )}

                                {availableSlots !== null && (
                                    <p className="text-xs font-bold text-[#00C853] -mt-2 text-right">
                                        Hiện còn {availableSlots} {unitLabel.toLowerCase().replace('số ', '')} trống
                                    </p>
                                )}

                                <div>
                                    <label className="text-[10px] font-black text-[#004D40]/40 uppercase tracking-widest mb-2 block">{unitLabel}</label>
                                    <div className="relative">
                                        <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFAB40]" size={18} />
                                        <input
                                            type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                            onBlur={(e) => { if (!e.target.value || Number(e.target.value) < 1) setQuantity(1); }}
                                            min="1"
                                            className="w-full bg-[#F5F5F5] border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl p-4 pr-12 outline-none focus:ring-2 focus:ring-[#FFAB40]/50 font-bold text-[#004D40]"
                                        />
                                    </div>
                                </div>
                                <hr className="border-[#E0F2F1] my-4" />

                                <div className="space-y-4 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                    <p className="text-[11px] font-extrabold text-[#004D40] uppercase tracking-wider flex items-center gap-1.5">
                                        <User size={14} className="text-[#FFAB40]" /> Thông tin người liên hệ
                                    </p>
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Họ và tên khách hàng *" value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full bg-white border border-[#E0F2F1] rounded-lg p-3 text-sm font-semibold outline-none focus:border-[#FFAB40] text-[#004D40] placeholder-gray-400" />
                                        <input type="tel" placeholder="Số điện thoại *" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="w-full bg-white border border-[#E0F2F1] rounded-lg p-3 text-sm font-semibold outline-none focus:border-[#FFAB40] text-[#004D40] placeholder-gray-400" />
                                        <input type="email" placeholder="Địa chỉ Email *" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} className="w-full bg-white border border-[#E0F2F1] rounded-lg p-3 text-sm font-semibold outline-none focus:border-[#FFAB40] text-[#004D40] placeholder-gray-400" />
                                        <textarea placeholder="Ghi chú đặc biệt cho nhà cung cấp (nếu có)..." value={custNote} onChange={(e) => setCustNote(e.target.value)} maxLength={1000} rows={2} className="w-full bg-white border border-[#E0F2F1] rounded-lg p-3 text-sm font-medium outline-none focus:border-[#FFAB40] text-[#004D40] placeholder-gray-400 resize-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center bg-[#F5F5F5] p-4 rounded-xl border border-[#E0F2F1]">
                                <span className="text-sm font-bold text-[#004D40]">Tổng tạm tính:</span>
                                <span className="text-xl font-black text-[#FFAB40]">{calculateTotal().toLocaleString('vi-VN')} đ</span>
                            </div>

                            <motion.button
                                whileHover={!isOwnerOfService ? { scale: 1.02 } : {}}
                                whileTap={!isOwnerOfService ? { scale: 0.98 } : {}}
                                onClick={handleBookingClick}
                                disabled={isOwnerOfService}
                                className={`w-full text-white py-5 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-md rounded-br-md font-black text-sm uppercase tracking-[0.3em] mt-6 flex items-center justify-center gap-3 transition-all shadow-xl
                                    ${isOwnerOfService ? 'bg-gray-400 cursor-not-allowed opacity-60 shadow-none' : 'bg-[#004D40] hover:bg-[#002B24] shadow-[#004D40]/20'}`}
                            >
                                <CheckCircle2 size={18} /> {isOwnerOfService ? 'Không thể tự đặt' : actionLabel}
                            </motion.button>
                        </motion.div>
                    </aside>
                </div>

                {loadingReviews ? (
                    <div className="text-center py-10 text-xs text-[#004D40] font-bold">
                        Đang tải đánh giá từ D-Pulse...
                    </div>
                ) : (
                    <ServiceReviews reviews={reviews} />
                )}
            </div>

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

            {/* POP-UP (MODAL) HIỂN THỊ THÔNG TIN CHỦ SỞ HỮU (OWNER) */}
            <AnimatePresence>
                {showOwnerModal && service.ownerId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowOwnerModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
                        >
                            {/* Lớp nền Header cho Modal */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#004D40] to-[#00695C]"></div>

                            <button onClick={() => setShowOwnerModal(false)} className="absolute top-6 right-6 text-white hover:text-[#FFAB40] transition bg-black/20 p-2 rounded-full z-10">
                                <X size={20} />
                            </button>

                            <div className="relative z-10 flex flex-col items-center mt-10">
                                <div className="w-24 h-24 rounded-full p-1 bg-white shadow-lg mb-4">
                                    <img src={service.ownerId.avatar || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                </div>

                                <h3 className="text-2xl font-cormorant font-bold text-[#004D40] text-center">{service.ownerId.fullName}</h3>

                                <div className="flex items-center gap-1.5 bg-[#E0F2F1] text-[#004D40] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2">
                                    <ShieldCheck size={14} /> Đối tác xác thực
                                </div>

                                <div className="w-full mt-8 space-y-3">
                                    <div className="flex items-center gap-4 bg-[#F5F5F5] p-4 rounded-2xl border border-[#E0F2F1]">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#FFAB40] shadow-sm">
                                            <Mail size={18} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email liên hệ</p>
                                            <p className="text-sm font-bold text-[#004D40] truncate" title={service.ownerId.email}>{service.ownerId.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-[#F5F5F5] p-4 rounded-2xl border border-[#E0F2F1]">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#00C853] shadow-sm">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đánh giá hệ thống</p>
                                            <p className="text-sm font-bold text-[#004D40]">Đối tác uy tín D-Pulse</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <FeedbackModal {...modalConfig} onClose={closeModal} />
        </div>
    );
}

export default ServiceDetails;