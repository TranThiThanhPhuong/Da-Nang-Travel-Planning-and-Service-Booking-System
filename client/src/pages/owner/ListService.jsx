import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  CalendarDays,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import axios from "../../hooks/axios";
import { useEffect } from "react";
import { useMemo } from "react";
import Pagination from "../common/Pagination";
import EmptyState from "../common/Empty";
import ConfirmModal from "../common/ConfirmModal";

const ListService = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);

  // lấy danh sách dịch vụ của owner hiện tại
  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get("/api/services/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error("Fetch services error:", error);
      alert(
        error.response?.data?.message || "Có lỗi khi tải danh sách dịch vụ",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    setPage(1);
  }, [getToken]);

  // Xử lý lọc & tìm kiếm dữ liệu
  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();

    return services.filter((service) => {
      const matchSearch =
        service.name?.toLowerCase().includes(keyword) ||
        service.address?.toLowerCase().includes(keyword);

      const matchType = filterType === "ALL" || service.type === filterType;
      const matchStatus =
        filterStatus === "ALL" || service.approvalStatus === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [services, search, filterType, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterStatus]);

  const handleDeleteClick = (service) => {
    setSelected(service);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selected) return;

    setDeleteLoading(true);
    try {
      const token = await getToken();
      const response = await axios.delete(`/api/services/${selected._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        alert("✅ Đã xóa dịch vụ thành công");
        await fetchServices(); // Reload data
        setShowDeleteModal(false);
        setSelected(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi khi xóa dịch vụ");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "HOTEL":
        return <span className="text-[#004d4d] font-bold">Khách sạn</span>;
      case "RESTAURANT":
        return <span className="text-[#FFAB40] font-bold">Nhà hàng</span>;
      case "ACTIVITY":
        return <span className="text-emerald-600 font-bold">Hoạt động</span>;
      default:
        return type;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="bg-[#004D40] text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
            ĐẠT DUYỆT
          </span>
        );
      case "PENDING":
        return (
          <span className="bg-[#FFAB40] text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
            CHỜ DUYỆT
          </span>
        );
      case "REJECTED":
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-red-200">
            TỪ CHỐI
          </span>
        );
      case "HIDDEN":
        return (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border border-gray-200">
            ĐÃ ẨN
          </span>
        );
      default:
        return status;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004D40]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-jakarta pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-cormorant font-bold text-[#004D40]"
        >
          Quản lý dịch vụ
        </motion.h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/owner/add-service")}
          className="flex items-center gap-2 bg-[#004D40] hover:bg-[#00332A] text-white px-5 py-2.5 rounded-tr-[20px] rounded-bl-[20px] rounded-tl-md rounded-br-md font-bold transition-colors shadow-lg shadow-[#004D40]/20"
        >
          <Plus size={20} /> Thêm dịch vụ mới
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden"
      >
        {/* Bộ lọc & Tìm kiếm */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-white/40">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/50"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-medium text-[#004D40] placeholder-[#004D40]/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#E0F2F1] p-2 rounded-lg text-[#004D40]">
              <Filter size={18} />
            </div>
            <select
              className="bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004D40]/20 font-bold text-[#004D40] cursor-pointer transition-all"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="HOTEL">Khách sạn/Lưu trú</option>
              <option value="RESTAURANT">Nhà hàng/Ẩm thực</option>
              <option value="ACTIVITY">Hoạt động/Tour</option>
            </select>
            <select
              className="bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004D40]/20 font-bold text-[#004D40] cursor-pointer transition-all"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đang hoạt động</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="HIDDEN">Đã ẩn</option>
            </select>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        {paginatedData.length === 0 ? (
          <EmptyState
            title="Không tìm thấy dịch vụ"
            description={
              search || filterType !== "ALL" || filterStatus !== "ALL"
                ? "Không có dịch vụ phù hợp với bộ lọc"
                : "Hãy tạo dịch vụ đầu tiên của bạn"
            }
          />
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#004D40]/5 text-[#004D40] text-xs uppercase tracking-wider border-b border-[#004D40]/10">
                  <th className="px-6 py-5 font-bold">Dịch vụ</th>
                  <th className="px-6 py-5 font-bold">Phân loại</th>
                  <th className="px-6 py-5 font-bold">Giá cơ bản</th>
                  <th className="px-6 py-5 font-bold">Trạng thái</th>
                  <th className="px-6 py-5 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {paginatedData.map((service, index) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(224, 242, 241, 0.4)" }}
                    key={service._id}
                    className="group transition-colors"
                  >
                    {/* SERVICE INFO */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={service.thumbnail || "/placeholder.jpg"}
                          alt={service.name}
                          className="w-14 h-14 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md object-cover border border-white shadow-sm"
                        />
                        <p
                          className="font-bold text-[#004D40] group-hover:text-[#FFAB40] transition-colors truncate max-w-[200px]"
                          title={service.name}
                        >
                          {service.name}
                        </p>
                      </div>
                    </td>

                    {/* TYPE */}
                    <td className="px-6 py-4 text-sm">
                      {getTypeLabel(service.type)}
                    </td>

                    {/* PRICE */}
                    <td className="px-6 py-4 text-sm font-bold text-[#004D40]">
                      {formatPrice(service.pricePerUnit || 0)} đ
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      {getStatusBadge(service.approvalStatus)}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-gray-400">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            navigate(
                              `/owner/inventory?serviceId=${service._id}`,
                            )
                          }
                          className="p-2 text-[#004D40] hover:bg-[#E0F2F1] rounded-lg transition-colors"
                          title="Lịch tồn kho"
                        >
                          <CalendarDays size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            navigate(`/owner/edit-service/${service._id}`)
                          }
                          className="p-2 text-[#FFAB40] hover:bg-orange-50 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClick(service)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa dịch vụ"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {paginatedData.length > 0 && totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </motion.div>

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa dịch vụ?"
        message={`Bạn có chắc chắn muốn xóa dịch vụ "${selected?.name}"? Dịch vụ sẽ bị ẩn và không hiển thị cho khách.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ListService;