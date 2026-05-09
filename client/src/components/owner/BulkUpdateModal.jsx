import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Save, Loader2 } from 'lucide-react';

const BulkUpdateModal = ({ serviceId, serviceName, serviceType, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    totalSlots: '',
    note: '',
  });

  const getLabel = () => {
    switch (serviceType) {
      case 'HOTEL':
        return 'Số phòng';
      case 'RESTAURANT':
        return 'Số bàn / suất';
      case 'ACTIVITY':
        return 'Số vé';
      default:
        return 'Số lượng';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate || !formData.totalSlots) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        '/api/inventory/bulk',
        {
          serviceId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          totalSlots: Number(formData.totalSlots),
          note: formData.note,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('✅ ' + response.data.message);
        onSuccess();
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    'w-full px-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-bold text-[#004D40] transition-all';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-2xl max-w-lg w-full p-6 font-jakarta"
        >
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-cormorant font-bold text-[#004D40]">
                Cập nhật Hàng loạt
              </h2>
              <p className="text-sm text-[#004D40]/60 font-medium mt-1">
                {serviceName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="text-gray-400" size={20} />
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* DATE RANGE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#004D40] mb-1.5">
                  Từ ngày <span className="text-[#FFAB40]">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#004D40] mb-1.5">
                  Đến ngày <span className="text-[#FFAB40]">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={inputStyle}
                />
              </div>
            </div>

            {/* TOTAL SLOTS */}
            <div>
              <label className="block text-sm font-bold text-[#004D40] mb-1.5">
                {getLabel()} <span className="text-[#FFAB40]">*</span>
              </label>
              <input
                type="number"
                value={formData.totalSlots}
                onChange={(e) =>
                  setFormData({ ...formData, totalSlots: e.target.value })
                }
                min="0"
                placeholder="0"
                className={inputStyle}
              />
            </div>

            {/* NOTE */}
            <div>
              <label className="block text-sm font-bold text-[#004D40] mb-1.5">
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                rows="3"
                placeholder="Ghi chú thêm..."
                className={`${inputStyle} resize-none`}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md font-bold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#004D40] text-white rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md font-bold hover:bg-[#00332A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Lưu
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkUpdateModal;