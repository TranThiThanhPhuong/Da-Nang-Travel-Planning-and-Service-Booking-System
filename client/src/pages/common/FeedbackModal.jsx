import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Loader2, X } from 'lucide-react';

const FeedbackModal = ({
    isOpen,
    onClose,
    type = 'info', // 'info' | 'warning' | 'error' | 'success' | 'confirm' | 'loading'
    title,
    message,
    onConfirm,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ'
}) => {
    if (!isOpen) return null;

    // Cấu hình UI theo từng loại (type)
    const config = {
        success: { icon: <CheckCircle2 className="text-green-500" size={40} />, color: 'bg-green-50' },
        error: { icon: <AlertCircle className="text-red-500" size={40} />, color: 'bg-red-50' },
        warning: { icon: <AlertTriangle className="text-amber-500" size={40} />, color: 'bg-amber-50' },
        info: { icon: <Info className="text-blue-500" size={40} />, color: 'bg-blue-50' },
        confirm: { icon: <AlertCircle className="text-[#FFAB40]" size={40} />, color: 'bg-[#FFAB40]/10' },
        loading: { icon: <Loader2 className="text-[#004D40] animate-spin" size={40} />, color: 'bg-[#E0F2F1]' },
    };

    const currentConfig = config[type] || config.info;
    const isLoading = type === 'loading';
    const isConfirm = type === 'confirm';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Lớp phủ Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={!isLoading ? onClose : undefined} // Đang loading thì cấm click ra ngoài để tắt
                />

                {/* Nội dung Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10"
                >
                    {/* Nút X góc phải (Ẩn khi đang loading) */}
                    {!isLoading && (
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    )}

                    <div className="p-8 flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${currentConfig.color}`}>
                            {currentConfig.icon}
                        </div>

                        {/* Text */}
                        <h3 className="text-2xl font-black text-[#004D40] mb-3">{title}</h3>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">{message}</p>

                        {/* Các nút bấm */}
                        {!isLoading && (
                            <div className="flex gap-4 w-full">
                                {isConfirm && (
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={isConfirm ? onConfirm : onClose}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-colors shadow-lg ${type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' :
                                        'bg-[#004D40] hover:bg-[#00332a] shadow-[#004D40]/30'
                                        }`}
                                >
                                    {isConfirm ? confirmText : 'Đã hiểu'}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FeedbackModal;