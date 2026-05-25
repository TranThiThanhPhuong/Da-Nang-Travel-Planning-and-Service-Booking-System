import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck, HelpCircle, Landmark, Phone, User, MapPin, Building, CheckSquare, Square } from 'lucide-react';

const CancelBookingModal = ({ isOpen, onClose, booking, onConfirmSubmit }) => {
    const [reason, setReason] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [customBankName, setCustomBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isAgreed, setIsAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');

    const POPULAR_BANKS = [
        { id: 'Techcombank', name: 'Techcombank' },
        { id: 'Vietcombank', name: 'Vietcombank' },
        { id: 'Agribank', name: 'Agribank' },
        { id: 'VietinBank', name: 'VietinBank' },
        { id: 'BIDV', name: 'BIDV' },
        { id: 'VPBank', name: 'VPBank' },
        { id: 'MBBank', name: 'MBBank' },
        { id: 'ACB', name: 'ACB' }
    ];

    if (!isOpen || !booking) return null;

    const isAllowedStatus = ['PENDING', 'PAID'].includes(booking.status);
    const checkInDate = new Date(booking.bookingDetails.checkInDate);
    const now = new Date();
    const hoursRemaining = (checkInDate - now) / (1000 * 60 * 60);
    const isEligibleTime = hoursRemaining >= 24;

    // Đơn PENDING được hủy không cần xét thời gian, đơn PAID phải trước 24h
    const canCancel = isAllowedStatus && (booking.status === 'PAID' ? isEligibleTime : true);

    const cancelReasons = [
        "Thay đổi kế hoạch cá nhân",
        "Tìm được dịch vụ khác phù hợp hơn",
        "Lý do sức khỏe / Công việc đột xuất",
        "Trải nghiệm đặt hàng trên hệ thống chưa tốt",
        "Lý do khác"
    ];

    // Hàm chuyển đổi tiếng Việt có dấu thành viết hoa không dấu chuẩn dữ liệu ngân hàng
    const removeVietnameseTones = (str) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toUpperCase();
    };

    const handleAccountNumberChange = (e) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) { // Chỉ chấp nhận ký tự số
            setAccountNumber(val);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');

        if (!reason) return setValidationError('Vui lòng chọn lý do hủy đơn.');
        if (!isAgreed) return setValidationError('Bạn phải xác nhận cam đoan thông tin chính xác.');

        const finalBankName = selectedBank === 'OTHER' ? customBankName : selectedBank;

        if (booking.status === 'PAID') {
            if (!finalBankName || !accountNumber || !accountName) {
                return setValidationError('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng để nhận tiền hoàn.');
            }
        }

        setSubmitting(true);

        const cancelPayload = {
            reason,
            bankName: booking.status === 'PAID' ? finalBankName : undefined,
            accountNumber: booking.status === 'PAID' ? accountNumber : undefined,
            accountName: booking.status === 'PAID' ? accountName : undefined,
        };

        await onConfirmSubmit(booking._id, cancelPayload);
        
        setSubmitting(false);
        setReason('');
        setSelectedBank('');
        setCustomBankName('');
        setAccountNumber('');
        setAccountName('');
        setIsAgreed(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-tr-[45px] rounded-bl-[45px] rounded-tl-xl rounded-br-xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-gray-100 my-8"
            >
                {/* Header */}
                <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertTriangle size={26} className="shrink-0" />
                        <h3 className="font-bold text-2sm">Xác nhận hủy đơn đặt chỗ trực tuyến</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[calc(100vh-140px)] overflow-y-auto space-y-6">
                    
                    {/* KHỐI 1: Thông tin liên hệ của Nhà cung cấp (Owner) */}
                    <div className="bg-emerald-50/60 rounded-tr-[45px] rounded-bl-[45px] rounded-tl-xl rounded-br-xl p-5 border border-emerald-100 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                            <span>Thông tin đơn vị quản lý</span>
                        </div>
                    <div className="space-y-4 gap-3 text-sm font-medium text-gray-600">
                        <p className="flex items-center gap-1.5 py-2">
                            <Landmark size={15} className="text-gray-400" />
                            Tên dịch vụ: <span className="text-gray-900 font-bold">{booking.serviceId?.name || 'Đang cập nhật'}</span>
                        </p>    
                        <p className="flex items-center gap-1.5 py-2">
                            <Building size={15} className="text-gray-400" />
                            Tên cơ sở: <span className="text-gray-900 font-bold">{booking.ownerApplication?.businessName || 'Nhà cung cấp'}</span>
                        </p>
                        <p className="flex items-center gap-1.5 py-2">
                            <Phone size={15} className="text-gray-400" />
                            Hotline liên hệ: <span className="text-red-600 font-extrabold">{booking.ownerApplication?.phoneNumber || 'Chưa cập nhật'}</span>
                        </p>
                        <p className="flex items-start gap-1.5 py-2 md:col-span-2">
                            <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                            <span>Địa điểm đăng ký: <span className="text-gray-900 font-semibold">{booking.ownerApplication?.businessAddress || 'Chưa cấu hình địa chỉ'}</span></span>
                        </p>
                        </div>
                    </div>

                    {/* Tóm tắt đơn hàng phía khách */}
                    <div className="bg-gray-50 rounded-tl-xl rounded-br-xl p-4 text-sm font-semibold border border-gray-200/60 grid grid-cols-2 gap-2">
                        <p className="text-gray-500">Mã đơn hàng: <span className="font-mono text-red-600 font-bold">{booking.bookingCode}</span></p>
                        <p className="text-gray-500 text-right">Trạng thái: 
                            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                booking.status === 'PAID' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {booking.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                            </span>
                        </p>
                    </div>

                    {!canCancel ? (
                        <div className="space-y-4 text-center py-4">
                            <div className="p-5 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm font-medium text-left leading-relaxed">
                                ⚠️ <strong>Từ chối hủy trực tuyến:</strong> Đơn hàng đã thanh toán và thời gian đến thời điểm khởi hành/nhận phòng còn ít hơn 24 giờ. Hệ thống không thể xử lý hoàn tiền tự động. Vui lòng gọi trực tiếp hotline của Owner ở phía trên để được giải quyết nội bộ.
                            </div>
                            <a href={`tel:${booking.ownerApplicationId?.phoneNumber || '19001234'}`} className="inline-flex items-center gap-2 px-8 py-3 bg-[#004D40] text-white font-bold rounded-xl text-sm shadow-md hover:bg-[#002B24] transition-all">
                                <Phone size={16} /> Gọi hỗ trợ khẩn cấp
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {validationError && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                                    {validationError}
                                </div>
                            )}

                            {/* Lý do hủy */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-extrabold text-gray-700 block uppercase tracking-wider">Lý do hủy đơn *</label>
                                <select 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full border border-gray-200 rounded-tl-xl rounded-br-xl px-3 py-3 text-sm font-semibold focus:outline-none focus:border-red-500 bg-white"
                                    required
                                >
                                    <option value="">-- Chọn nguyên nhân phù hợp --</option>
                                    {cancelReasons.map((r, idx) => (
                                        <option key={idx} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* KHỐI HOÀN TIỀN: BẮT BUỘC TỰ NHẬP KHI ĐƠN LÀ "PAID" */}
                            {booking.status === 'PAID' && (
                                <div className="bg-blue-50/50 p-5 rounded-tl-xl rounded-br-xl border border-blue-100 space-y-4">
                                    <div className="flex items-center gap-2 text-xs text-blue-900 font-extrabold uppercase tracking-wider">
                                        <ShieldCheck size={18} className="text-blue-600 shrink-0" />
                                        <span>Tài khoản chỉ định nhận tiền hoàn lại</span>
                                    </div>

                                    {/* Dropdown Ngân hàng */}
                                    <div className="space-y-1">
                                        <div className="relative">
                                            <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={selectedBank}
                                                onChange={(e) => {
                                                    setSelectedBank(e.target.value);
                                                    if (e.target.value !== 'OTHER') setCustomBankName('');
                                                }}
                                                className="w-full bg-white border border-gray-200 rounded-tl-xl rounded-br-xl pl-11 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-500"
                                                required={booking.status === 'PAID'}
                                            >
                                                <option value="">-- Danh sách ngân hàng hệ thống --</option>
                                                {POPULAR_BANKS.map((b) => (
                                                    <option key={b.id} value={b.name}>{b.name}</option>
                                                ))}
                                                <option value="OTHER">Ngân hàng khác (Tự nhập tay)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {selectedBank === 'OTHER' && (
                                        <div className="space-y-1">
                                            <input 
                                                type="text"
                                                value={customBankName}
                                                onChange={(e) => setCustomBankName(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-tl-xl rounded-br-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500"
                                                placeholder="Nhập chính xác tên Ngân hàng Thương mại"
                                                required={booking.status === 'PAID' && selectedBank === 'OTHER'}
                                            />
                                        </div>
                                    )}

                                    {/* Số tài khoản - Chỉ cho nhập số */}
                                    <div className="space-y-1">
                                        <input 
                                            type="text"
                                            inputMode="numeric"
                                            value={accountNumber}
                                            onChange={handleAccountNumberChange}
                                            className="w-full bg-white border border-gray-200 rounded-tl-xl rounded-br-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-blue-500"
                                            placeholder="Nhập số tài khoản"
                                            required={booking.status === 'PAID'}
                                        />
                                    </div>

                                    {/* Tên chủ tài khoản - Tự động IN HOA không dấu */}
                                    <div className="space-y-1">
                                        <input 
                                            type="text"
                                            value={accountName}
                                            onChange={(e) => setAccountName(removeVietnameseTones(e.target.value))}
                                            className="w-full bg-white border border-gray-200 rounded-tl-xl rounded-br-xl rounded-br-xl px-4 py-2.5 text-sm font-bold tracking-wider focus:outline-none focus:border-blue-500 placeholder:normal-case"
                                            placeholder="TÊN CHỦ TÀI KHOẢN"
                                            required={booking.status === 'PAID'}
                                        />
                                    </div>

                                    <p className="text-[11px] text-blue-800 font-medium leading-relaxed bg-blue-100/60 p-3 rounded-xl">
                                        💡 <strong>Quy trình bảo mật:</strong> Đối với đơn đã trả tiền, chỗ của bạn sẽ tạm giữ an toàn. Hệ thống gửi lệnh chờ duyệt đến nhà xe/chủ hộ. Tiền mặt và vé sẽ được hoàn trả đầy đủ sau khi Owner xác nhận lệnh chuyển tiền thành công.
                                    </p>
                                    
                                </div>
                            )}

                            {/* THÔNG BÁO CHO ĐƠN PENDING */}
                            {booking.status === 'PENDING' && (
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900 font-bold">
                                    <HelpCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                                    <span>Hệ thống nhận diện đây là đơn chưa thanh toán. Sau khi bạn gửi yêu cầu, hệ thống sẽ thực hiện hủy trực tiếp ngay để giải phóng chỗ trống cho người dùng khác.</span>
                                </div>
                            )}

                            {/* Chính sách hoàn tiền */}
                            <div className="bg-red-50/60 p-5 rounded-tl-xl rounded-br-xl border border-red-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs text-red-900 font-extrabold uppercase tracking-wider">
                                    <AlertTriangle size={18} className="text-red-600 shrink-0" />
                                    <span>Chính sách hoàn tiền khi hủy đơn</span>
                                </div>
                                
                                <div className="space-y-2 text-xs text-red-800 font-semibold">
                                    <div className="bg-white p-3 rounded-lg border border-red-100">
                                        <p className="font-bold text-red-700 mb-1">✓ Hủy trước 3 ngày:</p>
                                        <p className="text-red-600">Hoàn tiền <span className="font-extrabold text-lg text-green-600">100%</span></p>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-lg border border-red-100">
                                        <p className="font-bold text-red-700 mb-1">⚠️ Hủy trước 1-3 ngày:</p>
                                        <p className="text-red-600">Hoàn tiền <span className="font-extrabold text-lg text-orange-600">50%</span> (phạt 50% vì làm lỡ cơ hội bán của chủ dịch vụ)</p>
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-lg border border-red-100">
                                        <p className="font-bold text-red-700 mb-1">✗ Hủy trong vòng 24 giờ trước check-in:</p>
                                        <p className="text-red-600">Không hoàn tiền <span className="font-extrabold text-lg text-red-600">(0%)</span></p>
                                    </div>
                                </div>

                                <div className="mt-3 p-3 bg-red-100/50 rounded-lg">
                                    <p className="text-[11px] text-red-800 font-bold">
                                        ⏰ <strong>Thời gian còn lại:</strong> <span className="text-red-700 font-extrabold">{hoursRemaining.toFixed(1)} giờ</span> (Tính từ lúc này đến giờ check-in)
                                    </p>
                                </div>
                            </div>

                            {/* Checkbox cam kết bắt buộc */}
                            <div 
                                onClick={() => setIsAgreed(!isAgreed)}
                                className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer select-none hover:bg-gray-100/70 transition-colors"
                            >
                                <div className="text-red-500 mt-0.5 shrink-0">
                                    {isAgreed ? <CheckSquare size={20} className="fill-red-50" /> : <Square size={20} />}
                                </div>
                                <span className="text-xs text-gray-600 font-bold leading-relaxed">
                                    Tôi cam đoan thông tin cung cấp phía trên hoàn toàn chính xác và chấp nhận mọi điều khoản hoàn hủy quy định của hệ thống Travel.
                                </span>
                            </div>

                            {/* Điều hướng */}
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 active:scale-95 transition-transform"
                                >
                                    Quay lại
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!reason || !isAgreed || submitting}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-40 active:scale-95 transition-all"
                                >
                                    {submitting ? 'Đang gửi...' : 'Xác nhận hủy đơn'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CancelBookingModal;