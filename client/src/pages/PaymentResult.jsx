import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../hooks/axios'
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Home, ReceiptText } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const PaymentResult = () => {
    // Lấy trạng thái (success/cancel) và ID đơn hàng từ URL
    // Ví dụ URL: /payment/success/6a0995...
    const { status, bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [verifyState, setVerifyState] = useState('loading'); // 'loading' | 'success' | 'failed'
    const [message, setMessage] = useState('Đang xác thực giao dịch với ngân hàng...');

    useEffect(() => {
        const verifyPaymentWithServer = async () => {
            // Xử lý khi URL chứa tín hiệu hủy từ người dùng
            if (status === 'cancel' || searchParams.get('cancel') === 'true') {
                try {
                    // Gọi API xuống hệ thống để chuyển trạng thái sang CANCELLED và nhả kho ngay lập tức
                    await axios.post(`/api/payments/cancel/${bookingId}`);
                } catch (err) {
                    console.error('Lỗi khi kích hoạt luồng hủy đơn:', err);
                }

                setVerifyState('failed');
                setMessage('Bạn đã chủ động hủy quá trình thanh toán. Slot giữ chỗ đã được hoàn trả lại hệ thống.');
                return;
            }

            try {
                // Luồng xác thực thành công giữ nguyên...
                const res = await axios.get(`/api/payments/verify/${bookingId}`);
                if (res.data.data.status === 'PAID') {
                    setVerifyState('success');
                    setMessage('Thanh toán thành công! Đơn đặt dịch vụ của bạn đã được xác nhận.');
                }
            } catch (error) {
                console.error('Lỗi xác thực:', error);
                setVerifyState('failed');
                setMessage(error.response?.data?.message || 'Không thể xác thực giao dịch. Vui lòng liên hệ hỗ trợ.');
            }
        };

        if (bookingId) {
            verifyPaymentWithServer();
        }
    }, [bookingId, status, searchParams]);

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
                        <h2 className="text-3xl font-black text-[#004D40] mb-4">Tuyệt vời!</h2>
                        <p className="text-gray-600 font-medium leading-relaxed mb-8">{message}</p>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={() => navigate('/account?tab=bookings')}
                                className="w-full bg-[#004D40] text-white py-4 rounded-xl font-bold hover:bg-[#00332a] transition-colors flex items-center justify-center gap-2"
                            >
                                <ReceiptText size={20} /> Xem lịch sử đặt chỗ
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={20} /> Quay về Trang chủ
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
                                onClick={() => {
                                    const serviceId = searchParams.get('serviceId');
                                    if (serviceId) {
                                        navigate(`/services/${serviceId}`);
                                    } else {
                                        navigate(-1); // Fallback dự phòng
                                    }
                                }}
                                className="w-full bg-[#FFAB40] text-white py-4 rounded-xl font-bold hover:bg-[#e59939] transition-colors"
                            >
                                Thử đặt lại
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={20} /> Quay về Trang chủ
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentResult;