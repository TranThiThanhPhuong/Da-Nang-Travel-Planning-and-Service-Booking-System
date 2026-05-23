import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, ArrowRight, Star, CreditCard, Receipt, Search, Filter, Calendar, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import FeedbackModal from '../../components/FeedbackModal';

const SaaSManagement = () => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const location = useLocation();

    // Quản lý Tab nội bộ bên trong trang: 'pricing' | 'invoices'
    const [subTab, setSubTab] = useState(location.state?.tab || 'pricing');
    const [packages, setPackages] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'info', title: '', message: '' });

    const [currentPackageCode, setCurrentPackageCode] = useState('STARTER');
    const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const headers = { Authorization: `Bearer ${token}` };

                const [pkgRes, invRes, statusRes] = await Promise.all([
                    axios.get('/api/owner/saas/packages', { headers }),
                    axios.get('/api/owner/saas/transactions', { headers }),
                    axios.get('/api/owner/saas/status', { headers })
                ]);

                setPackages(pkgRes.data.data);
                setInvoices(invRes.data.data);

                setCurrentPackageCode(statusRes.data.data.currentPackage);
                setSubscriptionEndDate(statusRes.data.data.subscriptionEndDate);
            } catch (error) {
                toast.error('Có lỗi xảy ra khi đồng bộ dữ liệu hệ thống SaaS.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [getToken]);

    const handleUpgrade = async (pkg) => {
        const isCurrent = pkg.packageCode === currentPackageCode;
        const isFree = pkg.price === 0;

        // Nếu là gói miễn phí (Starter) và đang dùng thì không cần gia hạn
        if (isCurrent && isFree) {
            return toast('Gói Cơ bản mặc định không cần gia hạn!', { icon: '👏' });
        }

        const actionType = isCurrent ? 'Gia hạn' : 'Kích hoạt';

        const confirmMessage = isFree
            ? `Bạn có chắc chắn muốn chuyển về ${pkg.name}? (Lưu ý: Các dịch vụ vượt quá giới hạn sẽ bị tạm ẩn).`
            : `Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán an toàn để ${actionType.toLowerCase()} ${pkg.name} với chi phí ${pkg.price.toLocaleString('vi-VN')} đ.`;

        setModalConfig({
            isOpen: true,
            type: 'confirm',
            title: isFree ? 'Xác nhận chuyển gói' : `Xác nhận ${actionType.toLowerCase()}`,
            message: confirmMessage,
            onConfirm: async () => {
                setModalConfig({ isOpen: true, type: 'loading', title: 'Đang xử lý...', message: 'Vui lòng giữ kết nối trong giây lát.' });
                try {
                    const token = await getToken();
                    const res = await axios.post('/api/owner/saas/pay', { packageId: pkg._id }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data.data.checkoutUrl) {
                        window.location.href = res.data.data.checkoutUrl;
                    } else {
                        toast.success('Chuyển đổi gói thành công!');
                        window.location.reload();
                    }
                } catch (error) {
                    setModalConfig({ isOpen: true, type: 'error', title: 'Lỗi', message: 'Không thể khởi tạo yêu cầu lúc này.' });
                }
            }
        });
    };

    const getPackageBadgeDetails = (code) => {
        switch (code) {
            case 'ULTIMATE': return { icon: <Crown size={16} />, text: 'Ultimate VIP', css: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-md' };
            case 'PRO': return { icon: <Zap size={16} />, text: 'Chuyên Nghiệp Pro', css: 'bg-[#FFAB40] text-white shadow-md' };
            default: return { icon: <Star size={16} />, text: 'Cơ Bản Starter', css: 'bg-gray-100 text-gray-500 border border-gray-200' };
        }
    };

    const currentBadge = getPackageBadgeDetails(currentPackageCode);

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(invoice.payosOrderCode || '').includes(searchTerm);
        const matchesStatus = filterStatus === 'ALL' || invoice.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const inputStyle = "w-full pl-11 pr-4 py-2.5 bg-white border border-[#E0F2F1] rounded-xl outline-none text-sm font-bold text-[#004D40] placeholder-[#004D40]/40 focus:ring-2 focus:ring-[#004D40]/10 transition-all";

    return (
        <div className="space-y-8 font-jakarta pb-12">

            {/* THẺ TỔNG QUAN TÀI KHOẢN & BADGE TRẠNG THÁI HIỆN TẠI */}
            <div className="bg-gradient-to-br from-[#004D40] to-[#002D26] rounded-[32px] p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="space-y-2">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Trạng thái tài khoản đối tác</p>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        {user?.fullName}
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 ${currentBadge.css}`}>
                            {currentBadge.icon} {currentBadge.text}
                        </span>
                    </h2>
                    {subscriptionEndDate && currentPackageCode !== 'STARTER' && (
                        <p className="text-xs text-[#E0F2F1] font-medium flex items-center gap-1.5">
                            <Calendar size={14} /> Ngày hết hạn chu kỳ: {new Date(subscriptionEndDate).toLocaleDateString('vi-VN')}
                        </p>
                    )}
                </div>

                {/* THANH ĐIỀU HƯỚNG TAB CON */}
                <div className="bg-white/10 p-1.5 rounded-2xl flex gap-2 w-full sm:w-auto border border-white/10 backdrop-blur-md">
                    <button onClick={() => setSubTab('pricing')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${subTab === 'pricing' ? 'bg-white text-[#004D40] shadow-md' : 'text-white hover:bg-white/5'}`}>
                        <CreditCard size={14} /> Gói dịch vụ
                    </button>
                    <button onClick={() => setSubTab('invoices')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${subTab === 'invoices' ? 'bg-white text-[#004D40] shadow-md' : 'text-white hover:bg-white/5'}`}>
                        <Receipt size={14} /> Lịch sử hóa đơn
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20"><div className="w-10 h-10 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
            ) : (
                <AnimatePresence mode="wait">
                    {/* SUB-TAB 1: BẢNG GIÁ SO SÁNH */}
                    {subTab === 'pricing' && (
                        <motion.div key="pricing" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            {/* Bắt đầu vòng lặp */}
                            {packages.map((pkg, index) => {
                                const currentPkgObj = packages.find(p => p.packageCode === currentPackageCode);
                                const currentPrice = currentPkgObj ? currentPkgObj.price : 0;

                                const isCurrent = pkg.packageCode === currentPackageCode;
                                const isFree = pkg.price === 0;
                                const isDowngrade = pkg.price < currentPrice && !isCurrent;

                                const isRenewable = isCurrent && !isFree;

                                // Khóa nút nếu là gói Cơ bản đang dùng, hoặc là gói thấp hơn
                                const isDisabled = (isCurrent && isFree) || isDowngrade;

                                const isUltimate = pkg.packageCode === 'ULTIMATE';
                                const isPro = pkg.packageCode === 'PRO';

                                return (
                                    <div key={pkg._id} className={`relative flex flex-col bg-white rounded-3xl border transition-all duration-300 shadow-md ${isUltimate ? 'border-amber-400 shadow-amber-500/5 shadow-xl' : isPro ? 'border-[#FFAB40]' : 'border-gray-100 hover:border-[#004D40]/20'}`}>

                                        {isUltimate && (
                                            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                                                <Crown size={12} /> Khuyên dùng cho doanh nghiệp lớn
                                            </div>
                                        )}

                                        <div className="p-8 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-[#004D40] mb-2">{pkg.name}</h3>
                                                <div className="flex items-end gap-1 mb-6 border-b border-gray-50 pb-6">
                                                    <span className="text-4xl font-black tracking-tight text-[#004D40]">{pkg.price.toLocaleString('vi-VN')}</span>
                                                    <span className="text-sm font-bold text-gray-400 mb-1">đ / {pkg.durationDays} ngày</span>
                                                </div>

                                                <ul className="space-y-4">
                                                    <li className="flex items-start gap-2.5 text-sm font-medium text-gray-600">
                                                        <ShieldCheck size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                        <span>Cho phép chạy: <strong className="text-[#004D40]">{pkg.maxServices === -1 ? 'Không giới hạn' : `${pkg.maxServices} dịch vụ`}</strong></span>
                                                    </li>
                                                    {pkg.features.map((feat, i) => (
                                                        <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-gray-600">
                                                            <ShieldCheck size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                            <span>{feat}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <button
                                                onClick={() => handleUpgrade(pkg)}
                                                disabled={isDisabled}
                                                className={`w-full mt-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 
                                            ${isDisabled
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                        : isRenewable
                                                            ? 'bg-[#004D40] text-white hover:bg-[#00332a] shadow-md border border-[#004D40]'
                                                            : isUltimate
                                                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg'
                                                                : 'bg-[#FFAB40] text-white hover:bg-[#e59939]'
                                                    }`}
                                            >
                                                {/* TEXT ĐƯỢC CHIA LÀM 4 TRƯỜNG HỢP */}
                                                {isRenewable ? 'Gia hạn gói' : isCurrent ? 'Gói hiện tại' : isDowngrade ? 'Đã bao gồm' : 'Đăng ký nâng cấp'}

                                                {!(isDisabled || isRenewable) && <ArrowRight size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* SUB-TAB 2: LỊCH SỬ HÓA ĐƠN */}
                    {subTab === 'invoices' && (
                        <motion.div key="invoices" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/30" size={16} />
                                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm theo mã giao dịch..." className={inputStyle} />
                                </div>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputStyle} sm:w-48 pl-4 cursor-pointer`}>
                                    <option value="ALL">Tất cả trạng thái</option>
                                    <option value="PAID">Thành công</option>
                                    <option value="PENDING">Chờ xử lý</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-[#004D40]/70 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-4">Mã giao dịch</th>
                                            <th className="px-6 py-4">Gói dịch vụ</th>
                                            <th className="px-6 py-4">Giá thanh toán</th>
                                            <th className="px-6 py-4">Ngày tạo hóa đơn</th>
                                            <th className="px-6 py-4 text-center">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm font-medium">
                                        {filteredInvoices.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-16 text-gray-400 font-bold italic">Không tìm thấy biên lai giao dịch nào phù hợp.</td>
                                            </tr>
                                        ) : (
                                            filteredInvoices.map(invoice => (
                                                <tr key={invoice._id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-6 py-4 text-[#004D40] font-bold font-mono">{invoice.transactionCode}</td>
                                                    <td className="px-6 py-4 text-gray-700">{invoice.packageId?.name || invoice.packageCode}</td>
                                                    <td className="px-6 py-4 text-[#004D40] font-black">{invoice.amount.toLocaleString('vi-VN')} đ</td>
                                                    <td className="px-6 py-4 text-gray-400">{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${invoice.status === 'PAID' ? 'bg-green-50 text-green-600' : invoice.status === 'PENDING' ? 'bg-orange-50 text-[#FFAB40]' : 'bg-red-50 text-red-600'}`}>
                                                            {invoice.status === 'PAID' ? 'Thành công' : invoice.status === 'PENDING' ? 'Chờ duyệt' : 'Đã hủy'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            <FeedbackModal {...modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />
        </div>
    );
};

export default SaaSManagement;