import React, { useState, useEffect } from "react";
import { Search, Eye, Lock, CheckCircle, X, Filter, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import { adminService } from "../../services/adminService";
import EmptyState from "../common/Empty";
import Pagination from "../common/Pagination";
import FeedbackModal from "../common/FeedbackModal";

const UserManagement = () => {
  const { getToken } = useAuth();

  // --- 1. STATE QUẢN LÝ DỮ LIỆU ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // --- 2. STATE BỘ LỌC & PHÂN TRANG ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // --- 3. STATE UI (MODAL) ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  // --- LOGIC DEBOUNCE TÌM KIẾM ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset trang về 1 khi thay đổi bộ lọc
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  // --- LOGIC FETCH DỮ LIỆU ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = {
        page,
        limit: pageSize,
      };

      if (debouncedSearch) params.keyword = debouncedSearch;
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await adminService.getUsers(token, params);

      if (res.success) {
        setUsers(res.data);
        setTotalItems(res.totalItems || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách người dùng:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi lại API mỗi khi params thay đổi
  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  // --- LOGIC HÀNH ĐỘNG ---
  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    
    const confirmTitle = newStatus === "BLOCKED" ? "Khóa tài khoản" : "Mở khóa tài khoản";
    const confirmMsg = newStatus === "BLOCKED"
      ? "Bạn có chắc chắn muốn KHÓA tài khoản này? Người dùng sẽ không thể truy cập hệ thống."
      : "Bạn muốn MỞ KHÓA tài khoản này? Người dùng có thể đăng nhập bình thường.";

    // 1. BẬT MODAL HỎI XÁC NHẬN
    setModalConfig({
      isOpen: true,
      type: "confirm",
      title: confirmTitle,
      message: confirmMsg,
      onConfirm: () => executeUpdateStatus(userId, newStatus), // Gửi hàm thực thi vào callback
    });
  };

  // Hàm lõi thực thi gọi API sau khi Admin đã bấm "Xác nhận" trên Modal
  const executeUpdateStatus = async (userId, newStatus) => {
    try {
      // 2. CHUYỂN MODAL SANG TRẠNG THÁI LOADING (Khóa màn hình, hiện spinner)
      setModalConfig({
        isOpen: true,
        type: "loading",
        title: "Đang xử lý...",
        message: "Hệ thống đang đồng bộ cập nhật dữ liệu phân quyền tài khoản.",
      });

      const token = await getToken();
      const res = await adminService.updateUserStatus(token, userId, newStatus);

      if (res.success) {
        fetchUsers(); // Tải lại danh sách tài khoản mới

        // 3. HIỂN THỊ THÔNG BÁO THÀNH CÔNG VÀ CHỜ ADMIN BẤM "ĐÃ HIỂU" TO CLOSE
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Thành công!",
          message: newStatus === "BLOCKED" 
            ? "Tài khoản đã được khóa thành công." 
            : "Đã mở khóa tài khoản thành công.",
        });
      } else {
        // 4. HIỂN THỊ BÁO LỖI TỪ SERVER TRẢ VỀ
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Thao tác thất bại",
          message: res.message || "Có lỗi xảy ra trong quá trình cập nhật.",
        });
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      // 5. HIỂN THỊ BÁO LỖI ĐƯỜNG TRUYỀN / MẠNG
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Lỗi kết nối",
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
      });
    }
  };

  const handleViewDetails = async (userId) => {
    setLoadingDetail(true);
    // Mở modal dạng loading tạm thời
    setSelectedUser({ _id: userId, isLoading: true });

    try {
      const token = await getToken();
      const res = await adminService.getUserDetails(token, userId);
      if (res.success) {
        setSelectedUser(res.data);
      } else {
        setSelectedUser(null);
        alert(res.message);
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết:", error);
      setSelectedUser(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 font-jakarta">
      {/* BỘ LỌC */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-white/40">
          {/* SEARCH */}
          <div className="relative md:w-120">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/50" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-medium text-[#004D40] placeholder-[#004D40]/40 transition-all"
            />
          </div>

          {/* STATUS & ROLE FILTERS */}
          <div className="flex items-center gap-3">
            <div className="bg-[#E0F2F1] p-2 rounded-lg text-[#004D40]">
              <Filter size={18} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004D40]/20 font-bold text-[#004D40] cursor-pointer transition-all"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="BLOCKED">Đã khóa</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#004D40]/20 font-bold text-[#004D40] cursor-pointer transition-all"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="USER">Người dùng</option>
              <option value="OWNER">Chủ dịch vụ</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* BẢNG DỮ LIỆU */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/60 shadow overflow-hidden relative min-h-[300px]"
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="animate-spin text-[#004D40]" size={40} />
          </div>
        )}

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#004D40]/5 text-[#004D40] text-xs uppercase">
              <th className="px-6 py-4 text-left font-bold">Người dùng</th>
              <th className="px-6 py-4 text-left font-bold">Vai trò</th>
              <th className="px-6 py-4 text-left font-bold">Trạng thái</th>
              <th className="px-6 py-4 text-left font-bold">Ngày tham gia</th>
              <th className="px-6 py-4 text-right font-bold">Hành động</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-[#E0F2F1]/40 transition">
                {/* USER INFO */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || 'https://i.pinimg.com/736x/91/53/5b/91535bc90a800b532116028457cdd0f9.jpg'}
                      alt="avatar"
                      className="w-11 h-11 object-cover rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md border border-white shadow-sm"
                    />
                    <div>
                      <p className="font-bold text-[#004D40]">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* ROLE */}
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-xs font-bold text-[#004D40]">
                    {user.role === "OWNER" ? "Chủ dịch vụ" : user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                  </span>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === "ACTIVE"
                      ? "bg-[#E0F2F1] text-[#004D40]"
                      : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                  >
                    {user.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>

                {/* DATE */}
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>

                {/* ACTION */}
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleViewDetails(user._id)}
                      className="p-2 text-[#004D40] hover:bg-[#E0F2F1] rounded-lg transition"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>

                    {/* Không cho phép khóa tài khoản ADMIN (bảo vệ an toàn) */}
                    {user.role !== "ADMIN" && (
                      user.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleToggleStatus(user._id, user.status)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Khóa tài khoản"
                        >
                          <Lock size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(user._id, user.status)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Mở khóa tài khoản"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* MODAL CHI TIẾT NGƯỜI DÙNG */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSelectedUser(null)} />

          <div className="relative w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in duration-300">

            {/* Nếu đang loading chi tiết */}
            {selectedUser.isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="animate-spin text-[#004D40] mb-4" size={40} />
                <p className="text-[#004D40] font-bold">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                {/* HEADER MODAL */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-[#004D40]">Chi tiết người dùng</h3>
                  <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                    <X size={20} />
                  </button>
                </div>

                {/* BODY MODAL */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* LEFT: INFO CƠ BẢN */}
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedUser.avatar || 'https://i.pinimg.com/736x/91/53/5b/91535bc90a800b532116028457cdd0f9.jpg'}
                        alt="avatar"
                        className="w-20 h-20 object-cover rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md border border-white shadow"
                      />
                      <div>
                        <h4 className="text-lg font-bold text-[#004D40]">{selectedUser.fullName}</h4>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vai trò</span>
                        <span className="font-bold text-[#004D40]">{selectedUser.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trạng thái</span>
                        <span className={`font-bold ${selectedUser.status === "ACTIVE" ? "text-green-600" : "text-red-500"}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ngày tham gia</span>
                        <span className="font-medium text-[#004D40]">
                          {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Clerk ID</span>
                        <span className="font-medium text-gray-500 text-xs truncate max-w-[150px]">
                          {selectedUser.clerkId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: DỮ LIỆU SAAS (Chỉ hiện khi là OWNER) */}
                  <div className="p-6 border-l border-gray-100 space-y-6">
                    {selectedUser.role === "OWNER" ? (
                      <>
                        {/* BUSINESS CARD */}
                        <div className="bg-[#F5F5F5] p-4 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md">
                          <p className="text-xs text-gray-400 mb-1">Doanh nghiệp</p>
                          <p className="font-bold text-[#004D40] truncate">
                            {selectedUser.businessDetails?.businessName || "Chưa cập nhật tên DN"}
                          </p>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {selectedUser.businessDetails?.businessAddress || "Chưa cập nhật địa chỉ"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm ${selectedUser.businessDetails?.applicationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              selectedUser.businessDetails?.applicationStatus === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'
                              }`}>
                              {selectedUser.businessDetails?.applicationStatus || "NO DATA"}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                              Đã đăng: {selectedUser.totalServices || 0} dịch vụ
                            </span>
                          </div>
                        </div>

                        {/* SUBSCRIPTION SAAS */}
                        <div className="bg-gradient-to-br from-[#004D40] to-[#00332A] text-white p-5 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl shadow-lg">
                          <p className="text-xs opacity-70">Gói SaaS hiện tại</p>
                          <h4 className="text-lg font-bold mt-1 uppercase">GÓI {selectedUser.currentPackage || 'STARTER'}</h4>

                          <div className="mt-3 text-sm space-y-1">
                            <p>Trạng thái:
                              <span className={`ml-2 font-bold ${selectedUser.subscriptionStatus === 'EXPIRED' ? 'text-red-400' : 'text-green-300'}`}>
                                {selectedUser.subscriptionStatus || 'ACTIVE'}
                              </span>
                            </p>
                            {selectedUser.subscriptionEndDate && (
                              <p>Hết hạn: {new Date(selectedUser.subscriptionEndDate).toLocaleDateString('vi-VN')}</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-sm py-10">
                        <Shield className="mb-2 opacity-30" size={40} />
                        <p>Tài khoản người dùng tiêu chuẩn</p>
                        <p className="text-xs mt-1">Không có dữ liệu kinh doanh / SaaS</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* FOOTER MODAL */}
                <div className="flex justify-end px-6 py-4 border-t border-gray-100">
                  <button onClick={() => setSelectedUser(null)} className="px-5 py-2 bg-[#004D40] text-white rounded-xl font-bold hover:bg-[#00332A] transition">
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {users.length === 0 && !loading && (
        <EmptyState title="Không tìm thấy người dùng nào" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" />
      )}

      {/* PHÂN TRANG */}
      {users.length > 0 && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
      )}

      <FeedbackModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        confirmText="Xác nhận"
        cancelText="Hủy bỏ"
      />
    </div>
  );
};

export default UserManagement;