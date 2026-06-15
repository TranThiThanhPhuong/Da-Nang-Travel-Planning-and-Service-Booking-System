import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from '../../hooks/axios'
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Trash2 } from 'lucide-react';

const EditInventoryModal = ({ inventoryData, serviceType, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    totalSlots: inventoryData?.inventory?.totalSlots || '',
    note: inventoryData?.inventory?.note || '',
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

    if (!formData.totalSlots) {
      alert('Vui lòng nhập số lượng');
      return;
    }

    // Check if total < booked
    if (
      inventoryData.inventory &&
      Number(formData.totalSlots) < inventoryData.inventory.bookedSlots
    ) {
      alert(
        `Số lượng tối thiểu phải là ${inventoryData.inventory.bookedSlots} (số đã đặt)`
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();

      if (inventoryData.inventory) {
        // Update existing
        const response = await axios.put(
          `/api/inventory/${inventoryData.inventory._id}`,
          {
            totalSlots: Number(formData.totalSlots),
            note: formData.note,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          alert('✅ Cập nhật thành công');
          onSuccess();
        }
      } else {
        alert('Chưa có tồn kho cho ngày này. Vui lòng dùng cập nhật hàng loạt.');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!inventoryData.inventory) return;

    if (!confirm('Xác nhận xóa tồn kho ngày này?')) return;

    setDeleteLoading(true);
    try {
      const token = await getToken();
      const response = await axios.delete(
        `/api/inventory/${inventoryData.inventory._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('✅ Đã xóa tồn kho');
        onSuccess();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setDeleteLoading(false);
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
                Chỉnh sửa Tồn kho
              </h2>
              <p className="text-sm text-[#004D40]/60 font-medium mt-1">
                {formatDate(inventoryData.date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="text-gray-400" size={20} />
            </button>
          </div>

          {/* CURRENT STATUS */}
          {inventoryData.inventory && (
            <div className="mb-6 p-4 bg-[#E0F2F1] rounded-tr-2xl rounded-bl-2xl rounded-tl-lg rounded-br-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs font-medium text-[#004D40]/60 mb-1">
                    Tổng số
                  </div>
                  <div className="text-lg font-bold text-[#004D40]">
                    {inventoryData.inventory.totalSlots}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#004D40]/60 mb-1">
                    Đã đặt
                  </div>
                  <div className="text-lg font-bold text-amber-600">
                    {inventoryData.inventory.bookedSlots}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#004D40]/60 mb-1">
                    Còn lại
                  </div>
                  <div className="text-lg font-bold text-emerald-600">
                    {inventoryData.inventory.availableSlots}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                min={inventoryData.inventory?.bookedSlots || 0}
                placeholder="0"
                className={inputStyle}
              />
              {inventoryData.inventory && inventoryData.inventory.bookedSlots > 0 && (
                <p className="text-xs text-amber-600 mt-1.5 font-medium">
                  ⚠️ Tối thiểu: {inventoryData.inventory.bookedSlots} (đã có booking)
                </p>
              )}
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
              {inventoryData.inventory && inventoryData.inventory.bookedSlots === 0 && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md font-bold hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Xóa
                </button>
              )}
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

export default EditInventoryModal;