import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Eye, EyeOff, Save, RefreshCw,ShieldAlert } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import axios from '../../hooks/axios'
import FeedbackModal from '../../components/FeedbackModal';

const inputLabel = "text-[10px] font-black text-[#004D40]/40 uppercase tracking-[0.2em] ml-1 mb-2 block";
const inputStyle = "w-full bg-[#F5F5F5] border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl p-4 outline-none focus:ring-2 focus:ring-[#FFAB40]/50 font-bold text-[#004D40] placeholder:text-gray-300 transition-all shadow-inner";

const Settings = () => {
    const { getToken } = useAuth();
    
    // Khởi tạo State form đúng Schema cấu trúc phân cấp
    const [formData, setFormData] = useState({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        clientId: '',
        apiKey: '',
        checksumKey: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [showKeys, setShowKeys] = useState({ clientId: false, apiKey: false, checksumKey: false });

    // Trạng thái điều khiển FeedbackModal
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

    // ⚡ Lấy cấu hình hiện tại từ Database lên Form
    const fetchPaymentData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const response = await axios.get('/api/owner-applications/payment-config', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                const { bankAccount, payos } = response.data.data;
                setFormData({
                    bankName: bankAccount?.bankName || '',
                    accountNumber: bankAccount?.accountNumber || '',
                    accountHolderName: bankAccount?.accountHolderName || '',
                    clientId: payos?.clientId || '',
                    apiKey: payos?.apiKey || '',
                    checksumKey: payos?.checksumKey || ''
                });
            }
        } catch (error) {
            console.error("Lỗi lấy thông tin cấu hình:", error);
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Lỗi đồng bộ dữ liệu',
                message: error.response?.data?.message || 'Không thể tải cấu hình tài chính từ hệ thống.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPaymentData(); }, []);

    // 👁️ Ẩn/Hiện mã bảo mật Key
    const toggleKeyVisibility = (field) => {
        setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // ✍️ Quản lý thay đổi dữ liệu (In hoa tên chủ tài khoản tự động như logic form cũ)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const formattedValue = name === "accountHolderName" ? value.toUpperCase() : value;

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
        validateField(name, formattedValue);
    };

    // 🎯 Thực hiện Client-side Validation theo định dạng Regex Mongoose Schema
    const validateField = (name, value) => {
        let tempErrors = { ...errors };

        if (name === "accountNumber") {
            const accRegex = /^[0-9]{6,15}$/;
            tempErrors.accountNumber = accRegex.test(value) ? "" : "Số tài khoản chỉ chứa số và có độ dài từ 6 đến 15 ký tự.";
        }
        if (name === "accountHolderName") {
            tempErrors.accountHolderName = value.trim() ? "" : "Tên chủ tài khoản không được bỏ trống.";
        }
        setErrors(tempErrors);
    };

    // 💾 Luồng xử lý Lưu thông tin qua bước xác nhận (Confirm) của FeedbackModal
    const handleSubmitConfirm = (e) => {
        e.preventDefault();

        // Check lỗi tổng thể trước khi mở modal
        if (errors.accountNumber || errors.accountHolderName || !formData.bankName) {
            setModalConfig({ isOpen: true, type: 'warning', title: 'Dữ liệu không đúng', message: 'Vui lòng kiểm tra lại các trường lỗi màu đỏ trước khi lưu.' });
            return;
        }

        setModalConfig({
            isOpen: true,
            type: 'confirm',
            title: 'Xác nhận đổi cấu hình?',
            message: 'Thay đổi thông tin tài khoản thụ hưởng và key cổng PayOS sẽ ảnh hưởng trực tiếp đến dòng tiền thanh toán tự động của toàn bộ khách đặt dịch vụ từ lúc này.',
            confirmText: 'Đồng ý cập nhật',
            cancelText: 'Xem xét lại',
            onConfirm: executeUpdateConfig
        });
    };

    // 🚀 Thực thi hàm gọi API cập nhật xuống cơ sở dữ liệu
    const executeUpdateConfig = async () => {
        try {
            // Chuyển sang trạng thái Loading Modal
            setModalConfig({ isOpen: true, type: 'loading', title: 'Đang xử lý dữ liệu', message: 'Hệ thống đang đồng bộ và mã hóa thông tin dòng tiền an toàn...' });
            
            const token = await getToken();
            const updatePayload = {
                bankAccount: {
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    accountHolderName: formData.accountHolderName
                },
                payos: {
                    clientId: formData.clientId,
                    apiKey: formData.apiKey,
                    checksumKey: formData.checksumKey
                }
            };

            const response = await axios.put('/api/owner-applications/payment-config', updatePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                setModalConfig({
                    isOpen: true,
                    type: 'success',
                    title: 'Thành công!',
                    message: 'Cấu hình tài chính nhận tiền và cổng thanh toán đối tác đã thay đổi thành công.',
                    onClose: () => {
                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                        fetchPaymentData(); // Tải lại form để nhận chuỗi Masked mới từ Server
                    }
                });
            }
        } catch (error) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Cập nhật thất bại',
                message: error.response?.data?.message || 'Có lỗi xảy ra trong quá trình ghi dữ liệu bảo mật.'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <RefreshCw className="animate-spin text-[#004D40]" size={32} />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải cấu hình dòng tiền...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 font-jakarta pb-10">
            {/* Header thông tin cấu hình */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                <div className="w-12 h-12 bg-[#004D40] text-[#FFAB40] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center shadow-lg">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-cormorant font-bold text-[#004D40]">Cấu hình ví nhận tiền & Cổng thanh toán</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thiết lập tài khoản ngân hàng đối soát trực tiếp và đồng bộ cổng VietQR từ PayOS</p>
                </div>
            </div>

            {/* Khối Alert cảnh báo bảo mật */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex gap-3 text-xs text-amber-900">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                    <span className="font-black uppercase tracking-wider block mb-0.5">Lưu ý an toàn mật mã dữ liệu:</span>
                    <p className="font-medium text-gray-600 leading-relaxed">Để bảo vệ ví đối tác của bạn, các trường thông tin mã kết nối PayOS cũ sẽ được hệ thống che khuất dạng ẩn mã định danh. **Nếu bạn không thay đổi khóa bảo mật, vui lòng giữ nguyên chuỗi ẩn mã hiển thị trên form này khi ấn cập nhật.**</p>
                </div>
            </div>

            {/* Khung nhập liệu cấu hình chính */}
            <form onSubmit={handleSubmitConfirm} className="bg-white/80 backdrop-blur-md p-8 border border-[#004D40]/10 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-sm space-y-8">
                
                {/* PHÂN ĐOẠN 1: NGÂN HÀNG THỤ HƯỞNG */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-2">
                        <span className="text-sm font-black text-[#004D40] uppercase tracking-wide">❖ Tài khoản đối soát thụ hưởng</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={inputLabel}>Ngân hàng thụ hưởng</label>
                            <input
                                required
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleInputChange}
                                type="text"
                                placeholder="VD: Vietcombank, Techcombank..."
                                className={inputStyle}
                            />
                        </div>
                        <div>
                            <label className={inputLabel}>Số tài khoản</label>
                            <input
                                required
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleInputChange}
                                type="text"
                                placeholder="0123 456 789"
                                className={`${inputStyle} ${errors.accountNumber ? "border-red-500 ring-1 ring-red-500" : ""}`}
                            />
                            {errors.accountNumber && (
                                <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.accountNumber}</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className={inputLabel}>Chủ tài khoản (In hoa không dấu)</label>
                            <input
                                required
                                name="accountHolderName"
                                value={formData.accountHolderName}
                                onChange={handleInputChange}
                                type="text"
                                placeholder="VD: NGUYEN VAN A"
                                className={`${inputStyle} ${errors.accountHolderName ? "border-red-500 ring-1 ring-red-500" : ""}`}
                            />
                            {errors.accountHolderName && (
                                <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.accountHolderName}</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* PHÂN ĐOẠN 2: THÔNG TIN KẾT NỐI CỔNG PAYOS */}
                <section className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-gray-50 pb-2">
                        <span className="text-sm font-black text-[#004D40] uppercase tracking-wide">❖ Tích hợp hạ tầng PayOS</span>
                        <a
                            href="https://payos.vn/docs/huong-dan-su-dung/tao-kenh-thanh-toan/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-black text-[#FFAB40] hover:underline flex items-center gap-1 bg-[#004D40]/5 px-3 py-1.5 rounded-full w-fit"
                        >
                            <span>Tài liệu cấu hình tích hợp API PayOS ↗</span>
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* CLIENT ID */}
                        <div>
                            <label className={inputLabel}>Client ID</label>
                            <div className="relative">
                                <input
                                    required
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleInputChange}
                                    type={showKeys.clientId ? "text" : "password"}
                                    placeholder="Nhập Client ID PayOS"
                                    className={`${inputStyle} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleKeyVisibility("clientId")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004D40] transition-colors"
                                >
                                    {showKeys.clientId ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* API KEY */}
                        <div>
                            <label className={inputLabel}>API Key</label>
                            <div className="relative">
                                <input
                                    required
                                    name="apiKey"
                                    value={formData.apiKey}
                                    onChange={handleInputChange}
                                    type={showKeys.apiKey ? "text" : "password"}
                                    placeholder="Nhập API Key"
                                    className={`${inputStyle} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleKeyVisibility("apiKey")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004D40] transition-colors"
                                >
                                    {showKeys.apiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* CHECKSUM KEY */}
                        <div>
                            <label className={inputLabel}>Checksum Key</label>
                            <div className="relative">
                                <input
                                    required
                                    name="checksumKey"
                                    value={formData.checksumKey}
                                    onChange={handleInputChange}
                                    type={showKeys.checksumKey ? "text" : "password"}
                                    placeholder="Nhập Checksum Key"
                                    className={`${inputStyle} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleKeyVisibility("checksumKey")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004D40] transition-colors"
                                >
                                    {showKeys.checksumKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* KHỐI NÚT BẤM LƯU ĐƠN HÀNG */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-[#004D40] hover:bg-[#00332a] text-white font-bold py-3.5 px-8 rounded-tr-2xl rounded-bl-2xl rounded-tl-lg rounded-br-lg shadow-lg shadow-[#004D40]/20 transition-all transform hover:-translate-y-0.5"
                    >
                        <Save size={16} className="text-[#FFAB40]" />
                        <span>Cập nhật cấu hình dòng tiền</span>
                    </button>
                </div>
            </form>

            {/* DIỀU KHIỂN FEEDBACK MODAL HỆ THỐNG */}
            <FeedbackModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                onConfirm={modalConfig.onConfirm}
                onClose={modalConfig.onClose || (() => setModalConfig(prev => ({ ...prev, isOpen: false })))}
            />
        </div>
    );
};

export default Settings;