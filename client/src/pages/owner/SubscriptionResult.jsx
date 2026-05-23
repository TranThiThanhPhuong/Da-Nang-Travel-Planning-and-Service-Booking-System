import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, LayoutDashboard, ReceiptText, CreditCard } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const SubscriptionResult = () => {
    // Đọc orderCode và tín hiệu cancel từ URL (Ví dụ: ?orderCode=123456&cancel=true)
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [verifyState, setVerifyState] = useState('loading'); // 'loading' | 'success' | 'failed'
    const [message, setMessage] = useState('Đang xác thực giao dịch với cổng thanh toán...');

    useEffect(() => {
        const verifyPaymentWithServer = async () => {
            const orderCode = searchParams.get('orderCode');
            const isCancelled = searchParams.get('cancel') === 'true';

            if (!orderCode) {
                setVerifyState('failed');
                setMessage('Không tìm thấy mã giao dịch hợp lệ.');
                return;
            }

            try {
                const token = await getToken();

                // 1. Luồng Người dùng chủ động Hủy thanh toán
                if (isCancelled) {
                    // Gọi API hủy đơn bên SaaS
                    await axios.post('/api/owner/saas/cancel', { orderCode }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    setVerifyState('failed');
                    setMessage('Bạn đã chủ động hủy quá trình thanh toán nâng cấp gói.');
                    return;
                }

                // 2. Luồng Xác thực thanh toán thành công
                const res = await axios.post('/api/owner/saas/verify', { orderCode }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.data.status === 'PAID') {
                    setVerifyState('success');
                    setMessage('Thanh toán thành công! Gói dịch vụ của bạn đã được nâng cấp.');
                }
            } catch (error) {
                console.error('Lỗi xác thực SaaS:', error);
                setVerifyState('failed');
                setMessage(error.response?.data?.message || 'Không thể xác thực giao dịch. Vui lòng liên hệ hỗ trợ.');
            }
        };

        verifyPaymentWithServer();
    }, [searchParams, getToken]);

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6 font-jakarta">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[40px] p-10 md:p-14 max-w-lg w-full shadow-2xl text-center border-4 border-white"
            >
                {/* TRẠNG THÁI LOADING */}
                {verifyState === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-[#FFAB40] mb-6" size={80} strokeWidth={1.5} />
                        <h2 className="text-2xl font-black text-[#004D40] mb-2">Đang xử lý...</h2>
                        <p className="text-gray-500 font-medium">{message}</p>
                    </div>
                )}

                {/* TRẠNG THÁI THÀNH CÔNG */}
                {verifyState === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-green-500" size={60} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl font-black text-[#004D40] mb-4">Chúc mừng!</h2>
                        <p className="text-gray-600 font-medium leading-relaxed mb-8">{message}</p>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={() => navigate('/owner/subscription', { state: { tab: 'invoices' } })}
                                className="w-full bg-[#004D40] text-white py-4 rounded-xl font-bold hover:bg-[#00332a] transition-colors flex items-center justify-center gap-2"
                            >
                                <ReceiptText size={20} /> Xem hóa đơn
                            </button>
                            <button
                                onClick={() => navigate('/owner')}
                                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <LayoutDashboard size={20} /> Quay về Kênh Quản lý
                            </button>
                        </div>
                    </div>
                )}

                {/* TRẠNG THÁI THẤT BẠI / HỦY */}
                {verifyState === 'failed' && (
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="text-red-500" size={60} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl font-black text-[#004D40] mb-4">Giao dịch chưa hoàn tất</h2>
                        <p className="text-gray-600 font-medium leading-relaxed mb-8">{message}</p>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={() => navigate('/owner/subscription')}
                                className="w-full bg-[#FFAB40] text-white py-4 rounded-xl font-bold hover:bg-[#e59939] transition-colors flex items-center justify-center gap-2"
                            >
                                <CreditCard size={20} /> Thử nâng cấp lại
                            </button>
                            <button
                                onClick={() => navigate('/owner')}
                                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <LayoutDashboard size={20} /> Quay về Kênh Quản lý
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SubscriptionResult;