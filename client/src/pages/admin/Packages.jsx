import React, { useState, useEffect } from "react";
import { Package, Edit3, X, DollarSign, Calendar, ShieldCheck, Crown, Zap, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const Packages = () => {
  const { getToken } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);

  // Chỉ quản lý state cho trường Price vì các trường khác bị khóa
  const [newPrice, setNewPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch dữ liệu từ Database
  useEffect(() => {
    fetchPackages();
  }, [getToken]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get('/api/admin/saas/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPackages(res.data.data);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách gói dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Mở Modal chỉnh sửa
  const handleOpenModal = (pkg) => {
    setCurrentPackage(pkg);
    setNewPrice(pkg.price.toString());
    setIsModalOpen(true);
  };

  // 3. Xử lý Cập nhật Giá với các Ràng buộc logic
  const handleUpdatePrice = async () => {
    const updatedPrice = Number(newPrice);

    if (updatedPrice < 0) {
      return toast.error("Giá tiền không được là số âm.");
    }

    // Lấy thông tin các gói hiện tại để so sánh
    const proPkg = packages.find(p => p.packageCode === 'PRO');
    const ultPkg = packages.find(p => p.packageCode === 'ULTIMATE');

    // Kiểm tra ràng buộc kinh doanh
    if (currentPackage.packageCode === 'STARTER' && updatedPrice !== 0) {
      return toast.error("Gói Cơ bản (Starter) phải luôn miễn phí (0 đ).");
    }
    if (currentPackage.packageCode === 'PRO' && ultPkg && updatedPrice >= ultPkg.price) {
      return toast.error(`Giá gói PRO phải THẤP HƠN gói ULTIMATE (${ultPkg.price.toLocaleString('vi-VN')} đ).`);
    }
    if (currentPackage.packageCode === 'ULTIMATE' && proPkg && updatedPrice <= proPkg.price) {
      return toast.error(`Giá gói ULTIMATE phải CAO HƠN gói PRO (${proPkg.price.toLocaleString('vi-VN')} đ).`);
    }

    setIsUpdating(true);
    try {
      const token = await getToken();

      // Gửi toàn bộ data cũ lên, chỉ ghi đè thuộc tính price
      const payload = {
        ...currentPackage,
        price: updatedPrice
      };

      const res = await axios.put(`/api/admin/saas/packages/${currentPackage._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(`Đã cập nhật giá gói ${currentPackage.name} thành công!`);
        setIsModalOpen(false);
        fetchPackages(); // Tải lại danh sách
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Hàm render Icon tùy theo Gói
  const getPackageBadge = (code) => {
    switch (code) {
      case 'ULTIMATE': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md"><Crown size={12} /> Ultimate</span>;
      case 'PRO': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFAB40] text-white text-[10px] font-black uppercase tracking-wider shadow-md"><Zap size={12} /> Pro</span>;
      default: return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-black uppercase tracking-wider"><Star size={12} /> Starter</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-jakarta pb-10 p-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-[#004D40] flex items-center gap-3">
            <Package className="text-[#FFAB40]" size={32} /> Quản lý Gói dịch vụ
          </h1>
          <p className="text-[#004D40]/60 mt-1 font-medium text-sm">
            Thiết lập giá cước kinh doanh cho các gói tài khoản Đối tác (Owner).
          </p>
        </div>
      </motion.div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-[#004D40]/70 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Hạng gói</th>
                <th className="px-6 py-4">Tên gói hiển thị</th>
                <th className="px-6 py-4">Giá (VNĐ)</th>
                <th className="px-6 py-4">Chu kỳ</th>
                <th className="px-6 py-4">Giới hạn dịch vụ</th>
                <th className="px-6 py-4 text-center">Cập nhật giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16"><div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin mx-auto"></div></td>
                </tr>
              ) : (
                packages.map((pkg, idx) => (
                  <motion.tr
                    key={pkg._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-5">
                      {getPackageBadge(pkg.packageCode)}
                    </td>
                    <td className="px-6 py-5 font-bold text-[#004D40]">
                      {pkg.name}
                    </td>
                    <td className="px-6 py-5 font-black text-[#FFAB40] text-lg">
                      {pkg.price.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-medium flex items-center gap-2 mt-1">
                      <Calendar size={16} className="text-[#004D40]/40" /> {pkg.durationDays} ngày
                    </td>
                    <td className="px-6 py-5 text-[#004D40] font-bold">
                      {pkg.maxServices === -1 ? 'Không giới hạn' : `${pkg.maxServices} dịch vụ`}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleOpenModal(pkg)}
                        disabled={pkg.packageCode === 'STARTER'}
                        className={`p-2 rounded-lg transition-all ${pkg.packageCode === 'STARTER' ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-[#004D40] bg-[#004D40]/5 hover:bg-[#FFAB40] hover:text-white shadow-sm'}`}
                        title={pkg.packageCode === 'STARTER' ? "Không thể đổi giá gói mặc định" : "Chỉnh sửa giá"}
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* MODAL: CHỈNH SỬA GIÁ */}
      <AnimatePresence>
        {isModalOpen && currentPackage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#004D40] to-[#002D26] p-6 text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#FFAB40]">Cập nhật doanh thu</span>
                  <h2 className="text-xl font-black mt-0.5">Chỉnh sửa giá gói</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Thông tin readonly */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gói hiện tại</span>
                    {getPackageBadge(currentPackage.packageCode)}
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thời hạn</span>
                    <span className="font-bold text-[#004D40]">{currentPackage.durationDays} ngày</span>
                  </div>
                </div>

                {/* Form chỉnh sửa giá */}
                <div>
                  <label className="block text-xs font-black text-[#004D40] mb-2 uppercase tracking-wider">
                    Mức giá mới (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFAB40]"
                      size={20}
                    />
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="VD: 500000"
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-lg font-black text-[#004D40] focus:border-[#FFAB40] focus:ring-0 outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-medium italic">
                    * Lưu ý: Giá trị sẽ áp dụng ngay lập tức cho các giao dịch mới.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUpdating}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUpdatePrice}
                  disabled={isUpdating}
                  className="flex-1 bg-[#004D40] hover:bg-[#00332A] text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isUpdating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Lưu thay đổi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Packages;