import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import EmptyState from "../common/Empty";
import Pagination from "../common/Pagination";
import ConfirmModal from "../common/ConfirmModal";
import RejectModal from "../common/RejectModal";
import ImageZoomModal from "../common/ImageZoomModal";
import OwnerDetailModal from "./modals/OwnerDetailModal";

const Owners = () => {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [zoomImg, setZoomImg] = useState(null);
  const [page, setPage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const pageSize = 5;

  // 1. Hàm lấy danh sách từ Backend
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("/api/owner-applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(res.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách hồ sơ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [getToken]);

  // 2. Hàm Phê duyệt
  const handleApprove = async () => {
    try {
      const token = await getToken();
      await axios.patch(`/api/owner-applications/${selected._id}`,
        { status: "APPROVED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Đã phê duyệt đối tác thành công!");
      fetchApplications(); // Load lại danh sách
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi phê duyệt");
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  // 3. Hàm Từ chối
  const handleReject = async (reason) => {
    if (!reason) return alert("Vui lòng nhập lý do từ chối");
    try {
      const token = await getToken();
      await axios.patch(`/api/owner-applications/${selected._id}`,
        { status: "REJECTED", adminNotes: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(" Đã từ chối hồ sơ.");
      fetchApplications();
    } catch (error) {
      alert("Lỗi khi từ chối hồ sơ");
    } finally {
      setShowReject(false);
      setSelected(null);
    }
  };

  // FILTER
  const filtered = useMemo(() => {
    if (!search.trim() && statusFilter === "ALL") return applications;

    const keyword = search.toLowerCase().trim();

    return applications.filter((app) => {
      const matchSearch =
        app.businessName?.toLowerCase().includes(keyword) ||
        app.businessAddress?.toLowerCase().includes(keyword) ||
        app.phoneNumber?.includes(keyword) ||
        app.userId?.fullName?.toLowerCase().includes(keyword) ||
        app.userId?.email?.toLowerCase().includes(keyword);

      const matchStatus = statusFilter === "ALL" || app.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, applications]);

  // PAGINATION
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return {
          bg: "bg-[#FFAB40]/10",
          text: "text-[#FFAB40]",
          border: "border-[#FFAB40]/30",
          label: "Chờ duyệt",
        };
      case "APPROVED":
        return {
          bg: "bg-[#00C853]/10",
          text: "text-[#00C853]",
          border: "border-[#00C853]/30",
          label: "Đã duyệt",
        };
      case "REJECTED":
        return {
          bg: "bg-[#FF5252]/10",
          text: "text-[#FF5252]",
          border: "border-[#FF5252]/30",
          label: "Đã từ chối",
        };
      default:
        return {};
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#004D40]" size={40} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-jakarta pb-10">

      {/* BỘ LỌC */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden"
      >
        <div className="p-5 flex flex-col md:flex-row gap-4 justify-between">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/40"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm người đăng ký, doanh nghiệp, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-bold text-[#004D40] placeholder-[#004D40]/40"
            />
          </div>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004D40]/20 font-bold text-[#004D40] cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>

        <div className="px-5 pb-4">
          <p className="text-sm text-[#004D40]/60 font-medium">
            Tìm thấy{" "}
            <span className="text-[#004D40] font-bold">{filtered.length}</span>{" "}
            đơn đăng ký
          </p>
        </div>
      </motion.div>

      {/* TABLE */}
      {paginatedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#004D40]/5 text-[#004D40] text-xs uppercase">
                  <th className="px-6 py-4 text-left font-bold">Người đăng ký</th>
                  <th className="px-6 py-4 text-left font-bold">Doanh nghiệp</th>
                  <th className="px-6 py-4 text-left font-bold">Liên hệ</th>
                  <th className="px-6 py-4 text-left font-bold">Ngày đăng ký</th>
                  <th className="px-6 py-4 text-left font-bold">Trạng thái</th>
                  <th className="px-6 py-4 text-right font-bold">Hành động</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((app, idx) => {
                  const statusBadge = getStatusBadge(app.status);
                  return (
                    <motion.tr
                      key={app._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-[#E0F2F1]/40 transition"
                    >
                      <td className="px-6 py-4 font-bold text-[#004D40]">
                        {app.userId?.fullName}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[#004D40]">
                          <Building2 size={16} className="text-[#FFAB40]" />
                          <span className="font-medium">{app.businessName}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-[#004D40]/70">
                            <Phone size={12} />
                            {app.phoneNumber}
                          </div>
                          {app.email && (
                            <div className="flex items-center gap-1.5 text-xs text-[#004D40]/70">
                              <Mail size={12} />
                              {app.email}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#004D40]/70">
                          <Calendar size={12} />
                          {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          {getStatusBadge(app.status).label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelected(app)}
                            className="p-2 text-[#004D40] hover:bg-[#E0F2F1] rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>

                          {app.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelected(app);
                                  setShowConfirm(true);
                                }}
                                className="p-2 text-[#00C853] hover:bg-[#00C853]/10 rounded-lg transition-colors"
                                title="Phê duyệt"
                              >
                                <CheckCircle size={18} />
                              </button>

                              <button
                                onClick={() => {
                                  setSelected(app);
                                  setShowReject(true);
                                }}
                                className="p-2 text-[#FF5252] hover:bg-[#FF5252]/10 rounded-lg transition-colors"
                                title="Từ chối"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <EmptyState
          title="Không tìm thấy đơn đăng ký"
          description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
        />
      )}

      {/* PHÂN TRANG */}
      {paginatedData.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      {/* MODALS */}
      {selected && !showConfirm && !showReject && (
        <OwnerDetailModal
          application={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setShowConfirm(true)}
          onReject={() => setShowReject(true)}
          onImageClick={setZoomImg}
          getStatusBadge={getStatusBadge}
        />
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleApprove}
        title="Xác nhận phê duyệt?"
        message={`Bạn có chắc chắn muốn phê duyệt cho ${selected?.businessName}?`}
      />

      <RejectModal
        isOpen={showReject}
        onClose={() => setShowReject(false)}
        onReject={handleReject}
        placeholder={`VD: Giấy tờ không đầy đủ, thông tin không chính xác...`}
      />

      <ImageZoomModal image={zoomImg} onClose={() => setZoomImg(null)} />
    </div>
  );
};

export default Owners;