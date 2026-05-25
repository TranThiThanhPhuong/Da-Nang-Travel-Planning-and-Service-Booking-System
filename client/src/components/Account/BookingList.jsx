import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, AlertCircle, RefreshCcw, XCircle, CreditCard, Ticket, MessageSquare } from 'lucide-react';
import FeedbackModal from '../FeedbackModal';
import ReviewModal from './ReviewModal';
import CancelBookingModal from './modal/CancelBookingModal';

// ==========================================
// THẺ HIỂN THỊ CHI TIẾT TỪNG ĐƠN HÀNG
// ==========================================
const BookingCard = ({ booking, onActionTriggered, getToken, onExpire, onCancelRequest, onReview }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (booking.status !== 'PENDING') return;

        const timer = setInterval(() => {
            const difference = new Date(booking.expiresAt) - new Date();
            if (difference > 0) {
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                clearInterval(timer);
                setTimeLeft('00:00');
                // Hết giờ -> Kích hoạt callback báo cho Component cha đổi status sang EXPIRED
                onExpire(booking._id);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [booking.status, booking.expiresAt, booking._id, onExpire]);

    const statusConfig = {
        PENDING: { color: 'bg-yellow-50 text-yellow-600 border-yellow-200', label: 'Chờ thanh toán', icon: <Clock size={16} /> },
        PAID: { color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Đã thanh toán', icon: <CheckCircle2 size={16} /> },
        COMPLETED: { color: 'bg-green-50 text-green-600 border-green-200', label: 'Đã hoàn thành', icon: <CheckCircle2 size={16} /> },
        CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', label: 'Đã hủy', icon: <XCircle size={16} /> },
        CANCELLATION_PENDING: { color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Chờ duyệt hủy', icon: <Clock size={16} /> },
        EXPIRED: { color: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Hết hạn', icon: <AlertCircle size={16} /> }
    };

    const config = statusConfig[booking.status] || statusConfig.PENDING;

    const handlePayNow = async () => {
        onActionTriggered({ type: 'loading', title: 'Đang kết nối...', message: 'Vui lòng chờ trong giây lát.' });
        try {
            const token = await getToken();
            const res = await axios.post('/api/payments/create-link', { bookingId: booking._id }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.data.checkoutUrl) window.location.href = res.data.data.checkoutUrl;
        } catch (error) {
            onActionTriggered({ type: 'error', title: 'Lỗi thanh toán', message: 'Không thể tạo link thanh toán mới. Đơn hàng có thể đã hết hạn.' });
        }
    };

    const handlePendingCancelClick = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đặt chỗ này không?")) return;
        
        onActionTriggered({ type: 'loading', title: 'Đang xử lý...', message: 'Vui lòng chờ trong giây lát.' });
        try {
            await onExpire(booking._id); 
        } catch (error) {
            console.error("Lỗi khi hủy đơn chưa thanh toán:", error);
            onActionTriggered({ type: 'error', title: 'Thất bại', message: 'Không thể hủy đơn vào lúc này.' });
        }
    };

    const handleCancelClick = () => {
        onCancelRequest(booking);
    };

    const isFaded = booking.status === 'CANCELLED' || booking.status === 'EXPIRED';

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row gap-6 transition-all ${isFaded ? 'opacity-60 grayscale-[50%]' : 'hover:shadow-md'}`}>
            <div className="w-full md:w-48 h-32 rounded-tl-xl rounded-br-xl  overflow-hidden shrink-0 relative bg-gray-100">
                <img src={booking.serviceId?.thumbnail} alt="Service" className="w-full h-full object-cover" />
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase flex items-center gap-1 border ${config.color}`}>
                    {config.icon} {config.label}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg text-[#004D40]">{booking.serviceId?.name || 'Dịch vụ không xác định'}</h3>
                    </div>
                    <span className="text-sm font-black text-[#FFAB40]">{booking.bookingDetails.totalPrice.toLocaleString('vi-VN')} đ</span>
                    <p className="text-xs mt-2 font-semibold text-gray-400 mb-3">Mã đơn: <span className="text-[#004D40]">{booking.bookingCode}</span></p>

                    <div className="grid grid-cols-2 gap-y-2 text-sm text-[#004D40]/70 font-medium bg-gray-50 rounded-lg">
                        <div><span className="text-gray-400">Ngày đặt:</span> {new Date(booking.createdAt).toLocaleDateString('vi-VN')}</div>
                        <div><span className="text-gray-400">Số lượng:</span> {booking.bookingDetails.quantity}</div>
                        <div><span className="text-gray-400">Check-in:</span> {new Date(booking.bookingDetails.checkInDate).toLocaleDateString('vi-VN')}</div>
                        {booking.serviceId?.type === 'HOTEL' && <div><span className="text-gray-400">Check-out:</span> {new Date(booking.bookingDetails.checkOutDate).toLocaleDateString('vi-VN')}</div>}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    {booking.status === 'PENDING' && (
                        <>
                            <div className="mr-auto flex items-center gap-2 text-red-500 font-bold bg-red-50 px-3 py-2 rounded-lg text-sm">
                                <Clock size={16} /> Tự động hủy sau: {timeLeft}
                            </div>
                            <button onClick={handlePendingCancelClick} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                                Hủy đơn
                            </button>
                            <button onClick={handlePayNow} className="px-6 py-2 bg-[#FFAB40] text-white text-sm font-bold rounded-tl-xl rounded-br-xl  shadow-md hover:bg-[#e59939] flex items-center gap-2">
                                <CreditCard size={16} /> Thanh toán
                            </button>
                        </>
                    )}

                    {(isFaded || booking.status === 'COMPLETED') && (
                        <button onClick={() => window.location.href = `/services/${booking.serviceId?._id}`} className="px-5 py-2 border border-[#004D40] text-[#004D40] text-sm font-bold rounded-tl-xl rounded-br-xl  hover:bg-[#004D40] hover:text-white transition-all flex items-center gap-2">
                            <RefreshCcw size={16} /> Đặt lại
                        </button>
                    )}

                    {booking.status === 'PAID' && (
                        <button onClick={handleCancelClick} className="px-4 py-2 text-sm font-bold rounded-tl-xl rounded-br-xl text-gray-400 hover:text-red-500 transition-colors border border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                            Yêu cầu hủy đơn
                        </button>
                    )}

                    {booking.status === 'COMPLETED' && (
                        !booking.isReviewed ? (
                            <button onClick={() => onReview(booking)} className="px-5 py-2 bg-[#004D40] text-[#FFAB40] shadow-md text-sm font-bold rounded-tl-xl rounded-br-xl  hover:bg-[#002B24] transition-all flex items-center gap-2">
                                <MessageSquare size={16} /> Đánh giá dịch vụ
                            </button>
                        ) : (
                            <span className="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-tl-xl rounded-br-xl  border border-gray-200 flex items-center gap-1.5 cursor-not-allowed">
                                ✓ Đã gửi đánh giá
                            </span>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// COMPONENT CHÍNH QUẢN LÝ DANH SÁCH ĐƠN
// ==========================================
const BookingList = () => {
    const { getToken } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTab, setFilterTab] = useState('ALL');

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = await getToken();
                const res = await axios.get('/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${token}` } });
                setBookings(res.data.data || []); // Đảm bảo luôn là mảng để không bị lỗi .length
            } catch (error) {
                toast.error('Không thể tải lịch sử đặt chỗ.');
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [getToken]);

    const handleActionTriggered = (config) => {
        setModalConfig({ ...config, isOpen: true });
    };

    // Callback nhận tín hiệu hết hạn từ Component con để ép mảng đổi state => Chuyển Tab ngay lập tức
    const handleBookingExpired = (bookingId) => {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'EXPIRED' } : b));
    };

    // Hàm gọi chức năng đánh giá
    const handleReviewClick = (booking) => {
        setSelectedBooking(booking);
        setIsReviewOpen(true);
    };

    const handleReviewSuccess = (bookingId) => {
        // 1. Cập nhật thuộc tính isReviewed của phần tử trong mảng để ẩn nút ngay lập tức
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, isReviewed: true } : b));
        
        // 2. Gọi FeedbackModal loại success lên màn hình thông báo cho khách hàng
        setModalConfig({
            isOpen: true,
            type: 'success',
            title: 'Đánh giá thành công!',
            message: 'Cảm ơn bạn đã chia sẻ trải nghiệm thực tế. Đánh giá của bạn sẽ giúp cộng đồng có cái nhìn khách quan hơn!'
        });
    };

    const handleCancelRequest = (booking) => {
        setBookingToCancel(booking);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancelSubmit = async (bookingId, cancelPayload) => {
        handleActionTriggered({ type: 'loading', title: 'Đang xử lý...', message: 'Vui lòng đợi trong giây lát.' });
        try {
            const token = await getToken();
            await axios.post(`/api/bookings/${bookingId}/cancel`, cancelPayload, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setBookings(prev => prev.map(b => {
                if (b._id === bookingId) {
                    // Nếu đơn cũ là PENDING (chưa thanh toán) -> chuyển sang EXPIRED trên UI cho đồng bộ
                    // Nếu đơn cũ là PAID (đã thanh toán) -> chuyển sang CANCELLATION_PENDING để chờ chủ duyệt
                    const targetStatus = b.status === 'PENDING' ? 'EXPIRED' : 'CANCELLATION_PENDING';
                    return { ...b, status: targetStatus };
                }
                return b;
            }));
            handleActionTriggered({ 
                type: 'success', 
                title: 'Gửi yêu cầu thành công', 
                message: 'Hệ thống đã ghi nhận thông tin và đang tiến hành xử lý hoàn tiền từ chủ dịch vụ.' 
            });
        } catch (error) {
            handleActionTriggered({ 
                type: 'error', 
                title: 'Xử lý thất bại', 
                message: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.' 
            });
        } finally {           
            setIsCancelModalOpen(false);
            setBookingToCancel(null);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (filterTab === 'ALL') return true;
        if (filterTab === 'PENDING') return b.status === 'PENDING';
        if (filterTab === 'UPCOMING') return ['PAID', 'CANCELLATION_PENDING'].includes(b.status);
        if (filterTab === 'HISTORY') return ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(b.status);
        return true;
    });

    const filterOptions = [
        { id: 'ALL', label: 'Tất cả', count: 0 }, // Set 0 để ẩn badge
        { id: 'PENDING', label: 'Chờ thanh toán', count: bookings.filter(b => b.status === 'PENDING').length },
        { id: 'UPCOMING', label: 'Sắp diễn ra', count: bookings.filter(b => ['PAID', 'CANCELLATION_PENDING'].includes(b.status)).length },
        { id: 'HISTORY', label: 'Lịch sử', count: 0 }
    ];

    if (loading) return <div className="text-center py-20"><div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex gap-2 mb-8 bg-white/40 backdrop-blur-md p-1.5 rounded-xl border border-[#E0F2F1] flex-wrap">
                {filterOptions.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterTab(tab.id)}
                        className={`px-5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${filterTab === tab.id
                            ? 'bg-[#004D40] text-white shadow-md'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                        {/* Fix an toàn Vấn đề 2: Dùng optional chaining và điều kiện an toàn */}
                        {(tab.count || 0) > 0 && (
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${filterTab === tab.id ? 'bg-[#FFAB40] text-white' : 'bg-red-100 text-red-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Render danh sách hoặc màn hình trống */}
            {filteredBookings.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                    {/* <ReceiptText size={48} className="text-gray-300 mb-4 mx-auto" /> -> Nếu icon lỗi có thể do thư viện, nhưng import ở trên chuẩn rồi */}
                    <div className="text-gray-300 mb-4 flex justify-center"><Ticket size={48} /></div>
                    <h3 className="text-lg font-bold text-[#004D40] mb-2">Không tìm thấy đơn hàng</h3>
                    <p className="text-sm font-medium text-gray-500">Chưa có giao dịch nào phù hợp với bộ lọc này.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredBookings.map(booking => (
                            <motion.div key={booking._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <BookingCard
                                    booking={booking}
                                    onActionTriggered={handleActionTriggered}
                                    getToken={getToken}
                                    onExpire={handleBookingExpired}
                                    onReview={handleReviewClick}
                                    onCancelRequest={handleCancelRequest}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {isCancelModalOpen && (
                    <CancelBookingModal
                        isOpen={isCancelModalOpen}
                        onClose={() => {
                            setIsCancelModalOpen(false);
                            setBookingToCancel(null);
                        }}
                        booking={bookingToCancel}
                        onConfirmSubmit={handleConfirmCancelSubmit}
                    />
                )}
            </AnimatePresence>

            <ReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                booking={selectedBooking}
                onSuccess={handleReviewSuccess}
                getToken={getToken}
            />

            <FeedbackModal {...modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />
        </div>
    );
};

export default BookingList;