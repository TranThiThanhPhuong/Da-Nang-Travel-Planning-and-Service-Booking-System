import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, AlertCircle, RefreshCcw, XCircle, CreditCard, Ticket, MessageSquare, QrCode, X } from 'lucide-react';
import FeedbackModal from '../FeedbackModal';

// ==========================================
// THẺ HIỂN THỊ CHI TIẾT TỪNG ĐƠN HÀNG
// ==========================================
const BookingCard = ({ booking, onActionTriggered, getToken, onExpire, onShowTicket, onReview }) => {
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

    const handleCancel = () => {
        onActionTriggered({
            type: 'confirm',
            title: 'Xác nhận hủy đơn',
            message: 'Bạn có chắc chắn muốn hủy đơn hàng này? Tài nguyên sẽ được hoàn trả cho hệ thống.',
            onConfirm: async () => {
                onActionTriggered({ type: 'loading', title: 'Đang hủy...', message: 'Hệ thống đang xử lý yêu cầu.' });
                try {
                    const token = await getToken();
                    await axios.post(`/api/payments/cancel/${booking._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                    onActionTriggered({ type: 'success', title: 'Hủy thành công', message: 'Đơn hàng của bạn đã được hủy.' });
                    window.location.reload();
                } catch (error) {
                    onActionTriggered({ type: 'error', title: 'Lỗi', message: 'Không thể hủy đơn hàng lúc này.' });
                }
            }
        });
    };

    const isFaded = booking.status === 'CANCELLED' || booking.status === 'EXPIRED';

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row gap-6 transition-all ${isFaded ? 'opacity-60 grayscale-[50%]' : 'hover:shadow-md'}`}>
            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 relative bg-gray-100">
                <img src={booking.serviceId?.thumbnail} alt="Service" className="w-full h-full object-cover" />
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase flex items-center gap-1 border ${config.color}`}>
                    {config.icon} {config.label}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg text-[#004D40]">{booking.serviceId?.name || 'Dịch vụ không xác định'}</h3>
                        <span className="text-sm font-black text-[#FFAB40]">{booking.bookingDetails.totalPrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 mb-3">Mã đơn: <span className="text-[#004D40]">{booking.bookingCode}</span></p>

                    <div className="grid grid-cols-2 gap-y-2 text-sm text-[#004D40]/70 font-medium bg-gray-50 p-3 rounded-lg">
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
                            <button onClick={handleCancel} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                                Hủy đơn
                            </button>
                            <button onClick={handlePayNow} className="px-6 py-2 bg-[#FFAB40] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#e59939] flex items-center gap-2">
                                <CreditCard size={16} /> Thanh toán
                            </button>
                        </>
                    )}

                    {(isFaded || booking.status === 'COMPLETED') && (
                        <button onClick={() => window.location.href = `/services/${booking.serviceId?._id}`} className="px-5 py-2 border border-[#004D40] text-[#004D40] text-sm font-bold rounded-xl hover:bg-[#004D40] hover:text-white transition-all flex items-center gap-2">
                            <RefreshCcw size={16} /> Đặt lại
                        </button>
                    )}

                    {booking.status === 'PAID' && (
                        <button onClick={() => onShowTicket(booking)} className="px-5 py-2 bg-blue-500 text-white shadow-md text-sm font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2">
                            <Ticket size={16} /> Xem vé / Mã QR
                        </button>
                    )}

                    {booking.status === 'COMPLETED' && (
                        <button onClick={() => onReview(booking)} className="px-5 py-2 bg-[#004D40] text-[#FFAB40] shadow-md text-sm font-bold rounded-xl hover:bg-[#002B24] transition-all flex items-center gap-2">
                            <MessageSquare size={16} /> Đánh giá dịch vụ
                        </button>
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
    const [showTicketModal, setShowTicketModal] = useState(null); // Quản lý Pop-up hiển thị vé

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
        toast('Tính năng đánh giá đang được phát triển!', { icon: '🚧' });
        // Code logic ở đây
    };

    const filteredBookings = bookings.filter(b => {
        if (filterTab === 'ALL') return true;
        if (filterTab === 'PENDING') return b.status === 'PENDING';
        if (filterTab === 'UPCOMING') return b.status === 'PAID';
        if (filterTab === 'HISTORY') return ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(b.status);
        return true;
    });

    const filterOptions = [
        { id: 'ALL', label: 'Tất cả', count: 0 }, // Set 0 để ẩn badge
        { id: 'PENDING', label: 'Chờ thanh toán', count: bookings.filter(b => b.status === 'PENDING').length },
        { id: 'UPCOMING', label: 'Sắp diễn ra', count: bookings.filter(b => b.status === 'PAID').length },
        { id: 'HISTORY', label: 'Lịch sử', count: 0 }
    ];

    if (loading) return <div className="text-center py-20"><div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 border-b border-gray-100">
                {filterOptions.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterTab(tab.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${filterTab === tab.id
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
                                    onShowTicket={setShowTicketModal}
                                    onReview={handleReviewClick}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* POPUP HIỂN THỊ VÉ ĐIỆN TỬ DÀNH CHO ĐƠN PAID (Vấn đề 3) */}
            <AnimatePresence>
                {showTicketModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                            <button onClick={() => setShowTicketModal(null)} className="absolute top-4 right-4 text-white hover:text-red-200 transition-colors z-10"><X size={24} /></button>

                            <div className="bg-[#004D40] p-6 text-center text-white relative">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#FFAB40] mb-1">E-Ticket / Vé điện tử</h3>
                                <h2 className="text-2xl font-cormorant font-bold">{showTicketModal.serviceId?.name}</h2>
                            </div>

                            <div className="p-8 text-center bg-gradient-to-b from-gray-50 to-white">
                                <div className="inline-block p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl mb-6 shadow-sm">
                                    {/* Placeholder QR Code - Có thể thay bằng thư viện gen QR thực tế sau */}
                                    <QrCode size={120} strokeWidth={1} className="text-[#004D40]" />
                                </div>

                                <div className="space-y-4 text-left border border-gray-100 rounded-2xl p-5 bg-white shadow-sm">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-gray-400">Mã đơn hàng</p>
                                        <p className="font-bold text-[#004D40] text-lg">{showTicketModal.bookingCode}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-gray-400">Khách hàng</p>
                                            <p className="font-bold text-[#004D40] text-sm">{showTicketModal.bookingDetails.customerInfo.fullName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-gray-400">Số lượng</p>
                                            <p className="font-bold text-[#004D40] text-sm">{showTicketModal.bookingDetails.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-6 italic">Vui lòng xuất trình mã QR này tại quầy để sử dụng dịch vụ.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <FeedbackModal {...modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />
        </div>
    );
};

export default BookingList;