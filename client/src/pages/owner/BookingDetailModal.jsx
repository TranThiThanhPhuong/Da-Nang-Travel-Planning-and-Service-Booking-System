import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Calendar, FileText, CreditCard, Clock, CheckCircle2, XCircle, Copy, AlertTriangle, DollarSign } from 'lucide-react';

const BookingDetailModal = ({ isOpen, onClose, booking, handleConfirmRefund}) => {
    if (!isOpen || !booking) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const getUnitLabel = (type) => {
        switch (type) {
            case 'HOTEL': return 'Số phòng';
            case 'RESTAURANT': return 'Số chỗ/suất đặt';
            case 'ACTIVITY': return 'Số vé';
            default: return 'Số lượng đặt';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Đã sao chép mã giao dịch vào bộ nhớ tạm!');
    };

    // Kiểm tra đơn hàng có phát sinh dữ liệu hủy/hoàn tiền hay không
    const hasCancellation = booking.cancellationDetails && (booking.status === 'CANCELLATION_PENDING' || booking.cancellationDetails.requestedAt);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center mt-16 p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-[#00241e]/60 backdrop-blur-sm"
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white/95 backdrop-blur-md rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-2xl border border-white max-w-2xl w-full overflow-hidden z-10 font-jakarta max-h-[85vh] flex flex-col"
            >
                {/* Header Modal - Dynamic Colors theo trạng thái */}
                <div className={`p-5 text-white flex justify-between items-center ${
                    booking.status === 'PAID' ? 'bg-emerald-600' : 
                    booking.status === 'COMPLETED' ? 'bg-[#004D40]' : 
                    booking.status === 'CANCELLATION_PENDING' ? 'bg-amber-600' : 'bg-red-700'
                }`}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FFAB40]">Mã đặt chỗ hệ thống</p>
                        <h3 className="text-xl font-bold font-cormorant mt-0.5">{booking.bookingCode}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Nội dung chi tiết */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    
                    {/* KHỐI 1: ALERT DYNAMIC TRẠNG THÁI HỆ THỐNG */}
                    {booking.status === 'PAID' && (
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3 text-xs">
                            <Clock className="text-teal-600 shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="font-bold text-sm text-teal-800">Đơn đặt chỗ: ĐÃ THANH TOÁN</p>
                                <p className="mt-0.5 text-gray-500 font-medium">Khách hàng đã thực hiện thanh toán dòng tiền thành công. Dịch vụ sẵn sàng phục vụ tại cơ sở.</p>
                            </div>
                        </div>
                    )}

                    {booking.status === 'CANCELLATION_PENDING' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs">
                            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="font-bold text-sm text-amber-800">Trạng thái: CHỜ HOÀN TIỀN</p>
                                <p className="mt-0.5 text-gray-500 font-medium">Khách hàng đã yêu cầu hủy đơn và đang chờ xử lý hoàn tiền từ phía Owner. Vui lòng kiểm tra chi tiết yêu cầu hủy để thực hiện duyệt hoàn tiền.</p>
                            </div>
                        </div>
                    )}

                    {booking.status === 'COMPLETED' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs">
                            <CheckCircle2 className="text-[#004D40] shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="font-bold text-sm text-[#004D40]">Đơn đặt chỗ: ĐÃ HOÀN THÀNH</p>
                                <p className="mt-0.5 text-gray-500 font-medium">Đơn hàng đã làm thủ tục trả chỗ/hoàn thành chu kỳ trải nghiệm.</p>
                            </div>
                        </div>
                    )}

                    {booking.status === 'CANCELLED' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs">
                            <XCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="font-bold text-sm text-red-700">Đơn đặt chỗ: ĐÃ HỦY ĐƠN</p>
                                <p className="mt-0.5 text-gray-500 font-medium">Đơn hàng đã bị hủy và không còn hiệu lực. Nếu có yêu cầu hoàn tiền, vui lòng kiểm tra chi tiết lý do hủy và trạng thái dòng tiền hoàn trả.</p>
                            </div>
                        </div>
                    )}
                    
                    {/* KHỐI 2: THÔNG TIN KHÁCH HÀNG */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-[#004D40] tracking-wider flex items-center gap-2"><User size={14}/> Thông tin khách hàng</h4>
                        <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-2 border border-gray-100">
                            <div className="flex justify-between"><span className="text-gray-400">Họ và tên:</span> <span className="font-bold text-[#004D40]">{booking.bookingDetails?.customerInfo?.fullName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Số điện thoại:</span> <span className="font-semibold">{booking.bookingDetails?.customerInfo?.phoneNumber}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Địa chỉ Email:</span> <span className="font-semibold text-gray-600">{booking.bookingDetails?.customerInfo?.email}</span></div>
                            {booking.bookingDetails?.customerInfo?.note && (
                                <div className="pt-2 border-t border-gray-200 mt-2">
                                    <span className="text-gray-400 block text-[10px] font-bold">GHI CHÚ:</span>
                                    <p className="text-xs italic text-gray-600 mt-1 bg-orange-50/50 p-2 rounded border border-orange-100">{booking.bookingDetails.customerInfo.note}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KHỐI 3: CHI TIẾT DỊCH VỤ */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-[#004D40] tracking-wider flex items-center gap-2"><Calendar size={14}/> Chi tiết dịch vụ & Thời gian</h4>
                        <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-2 border border-gray-100">
                            <div className="flex justify-between"><span className="text-gray-400">Tên dịch vụ:</span> <span className="font-bold text-[#004D40]">{booking.serviceId?.name}</span></div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 block text-[10px]">Ngày bắt đầu (Check-in):</span><span className="font-bold text-gray-700">{booking.bookingDetails?.checkInDate ? new Date(booking.bookingDetails.checkInDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                <span className="text-gray-400 block text-[10px]">Ngày kết thúc (Check-out):</span><span className="font-bold text-gray-700">{booking.bookingDetails?.checkOutDate ? new Date(booking.bookingDetails.checkOutDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 5: DÒNG TIỀN GIAO DỊCH GỐC (Luôn hiển thị) */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-[#004D40] tracking-wider flex items-center gap-2"><FileText size={14}/> Chi tiết dòng tiền gốc từ hệ thống</h4>
                        <div className="bg-gradient-to-br from-[#E0F2F1]/40 to-white p-4 rounded-xl text-xs space-y-2 border border-[#E0F2F1]">
                            <div className="flex justify-between"><span className="text-gray-400">Giá gốc niêm yết công khai:</span> <span className="font-medium">{formatCurrency(booking.serviceId?.pricePerUnit)}</span></div>
                            <div className="flex justify-between text-red-500"><span className="text-gray-400">Khuyến mãi(%): </span> <span>{booking.serviceId?.discount}%</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Đơn giá áp dụng cuối sau giảm:</span> <span className="font-medium">{formatCurrency(booking.serviceId?.finalPrice)}</span></div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">{getUnitLabel(booking.serviceId?.type)}:</span> 
                                <span className="font-black text-[#004D40]">{booking.bookingDetails?.quantity}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Khoảng thời gian (Check-in → Check-out):</span>
                                <span className="font-bold text-[#004D40]">
                                    {(() => {
                                        const checkIn = new Date(booking.bookingDetails?.checkInDate);
                                        const checkOut = new Date(booking.bookingDetails?.checkOutDate);
                                        const dayCount = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                                        const unitLabel = getUnitLabel(booking.serviceId?.type);
                                        if (unitLabel === 'Số phòng') {
                                            return `${dayCount} ${dayCount === 1 ? 'đêm' : 'đêm'}`;
                                        } else if (unitLabel === 'Số vé') {
                                            return `${dayCount} ${dayCount === 1 ? 'ngày' : 'ngày'}`;
                                        } else {
                                            return `${dayCount} ${dayCount === 1 ? 'ngày' : 'ngày'}`;
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-[#004D40]/10 flex justify-between items-center">
                                <span className="font-bold text-[#004D40]">Tổng thanh toán:</span>
                                <span className="text-lg font-black text-[#004D40]">{formatCurrency(booking.bookingDetails?.totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 4: CHI TIẾT XỬ LÝ HOÀN TIỀN PHÁT SINH KHI CÓ YÊU CẦU HỦY ĐƠN */}
                    {hasCancellation && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-2"><DollarSign size={14}/> Chi tiết xử lý hoàn tiền phát sinh</h4>
                            <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl text-xs space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-gray-600 pb-2 border-b border-amber-200/60">
                                    <div>Lý do hủy đơn: <span className="font-semibold block text-gray-800 italic">"{booking.cancellationDetails.reason}"</span></div>
                                    <div className="text-right">Tỷ lệ hoàn tiền: <span className="font-bold text-amber-700 block text-sm">{(booking.cancellationDetails.refundRate * 100)}%</span></div>
                                </div>

                                {/* Thông tin Tài khoản nhận tiền hoàn trả */}
                                {booking.cancellationDetails.bankInfo?.accountNumber ? (
                                    <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1.5">
                                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Tài khoản chỉ định của khách hàng</p>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Ngân hàng:</span> 
                                            <span className="font-bold text-gray-800">{booking.cancellationDetails.bankInfo.bankName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Số tài khoản:</span> 
                                            <span className="font-mono font-bold text-blue-600 text-sm select-all">{booking.cancellationDetails.bankInfo.accountNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Tên chủ thẻ:</span> 
                                            <span className="font-semibold uppercase text-gray-800">{booking.cancellationDetails.bankInfo.accountName}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2 text-gray-500 italic">Hệ thống ghi nhận đơn chưa thanh toán - Hủy trực tiếp không qua dòng tiền bank.</div>
                                )}

                                {/* Phân tích kế toán tiền phạt & tiền trả khách */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between"><span className="text-gray-500">Tổng tiền khách đã thanh toán:</span> <span className="font-semibold text-gray-700">{formatCurrency(booking.bookingDetails?.totalPrice)}</span></div>
                                    <div className="flex justify-between text-red-600"><span className="text-gray-500">Phí phạt hủy đơn (Giữ lại cho Owner):</span> <span>+{formatCurrency(booking.cancellationDetails.penaltyAmount)}</span></div>
                                    <div className="flex justify-between text-emerald-600 pt-1 border-t border-dashed border-amber-200 text-sm">
                                        <span className="font-bold">Số tiền Owner thực chuyển cho khách:</span> 
                                        <span className="font-black text-base">{formatCurrency(booking.cancellationDetails.refundAmount)}</span>
                                    </div>
                                </div>

                                {/* Trạng thái chuyển tiền của Owner */}
                                <div className="pt-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                    <span className="text-gray-400">Trạng thái dòng tiền:</span>
                                    {booking.cancellationDetails.refundedAt ? (
                                        <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Đã chuyển tiền vào: {new Date(booking.cancellationDetails.refundedAt).toLocaleString('vi-VN')}</span>
                                    ) : (
                                        <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded animated-pulse">Chờ chuyển khoản thanh toán</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chứng thực dòng tiền PayOS gốc nếu có */}
                    {['PAID', 'COMPLETED', 'CANCELLATION_PENDING'].includes(booking.status) && booking.paymentDetails?.transactionId && (
                        <div className="flex justify-between items-center bg-slate-100/80 px-3 py-2 rounded-lg text-[11px] text-slate-600 border border-slate-200/60">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-500 text-[10px] uppercase">Mã giao dịch PayOS gốc:</span>
                                <span className="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">{booking.paymentDetails.transactionId}</span>
                            </div>
                            <button 
                                onClick={() => copyToClipboard(booking.paymentDetails.transactionId)}
                                className="flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-800 transition-colors cursor-pointer"
                            >
                                <Copy size={12} /> Sao chép
                            </button>
                        </div>
                    )}
                </div>

                {/* KHỐI NÚT CHỨC NĂNG Ở FOOTER (DÀNH CHO OWNER ĐỂ DUYỆT HOÀN TIỀN TRỰC TIẾP) */}
                {booking.status === 'CANCELLATION_PENDING' && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-br-2xl">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                        >
                            Đóng lại
                        </button>
                        <button
                            onClick={() => handleConfirmRefund(booking._id, booking.cancellationDetails?.refundAmount || 0)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <CheckCircle2 size={14} /> Xác nhận đã chuyển khoản trả khách
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default BookingDetailModal;