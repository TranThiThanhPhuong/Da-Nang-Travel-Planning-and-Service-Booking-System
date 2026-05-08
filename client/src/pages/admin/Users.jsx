import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Eye,
  Lock,
  CheckCircle,
  Shield,
  Calendar,
  Mail,
  User as UserIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import mockUsers from "./mockdatas/mockUsers";
import EmptyState from "../common/Empty";
import Pagination from "../common/Pagination";

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const pageSize = 5;

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();

    return mockUsers.filter((user) => {
      const matchSearch =
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword);

      const matchStatus =
        statusFilter === "ALL" || user.status === statusFilter;
      const matchType = roleFilter === "ALL" || user.role === roleFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, roleFilter]);

  // PAGINATION
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter]);

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
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/50"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-medium text-[#004D40] placeholder-[#004D40]/40 transition-all"
            />
          </div>

          {/* STATUS FILTER */}
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

            {/* ROLE FILTER */}
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

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-[10px] 
      rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl 
      border border-white/60 shadow overflow-hidden"
      >
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
            {paginatedData.map((user) => (
              <tr key={user.id} className="hover:bg-[#E0F2F1]/40 transition">
                {/* USER */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      className="w-11 h-11 
                      rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md
                      border border-white shadow-sm"
                    />
                    <div>
                      <p className="font-bold text-[#004D40]">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* ROLE */}
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-xs font-bold text-[#004D40]">
                    {user.role === "OWNER" ? "Chủ dịch vụ" : "Người dùng"}
                  </span>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.status === "ACTIVE"
                        ? "bg-[#E0F2F1] text-[#004D40]"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    {user.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>

                {/* DATE */}
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {user.createdAt}
                </td>

                {/* ACTION */}
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-[#004D40] hover:bg-[#E0F2F1] rounded-lg"
                    >
                      <Eye size={18} />
                    </button>

                    {user.status === "ACTIVE" ? (
                      <button
                        onClick={() => {
                          setConfirmUser(user);
                          setConfirmAction("LOCK");
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Lock size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmUser(user);
                          setConfirmAction("UNLOCK");
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* MODAL DETAIL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setSelectedUser(null)}
          />

          {/* modal */}
          <div
            className="relative w-full max-w-3xl 
    bg-white/90 backdrop-blur-xl 
    rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl
    border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.2)]
    animate-in fade-in zoom-in duration-300"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#004D40]">
                Chi tiết người dùng
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* LEFT */}
              <div className="p-6 space-y-6">
                {/* avatar */}
                <div className="flex items-center gap-4">
                  <img
                    src={selectedUser.avatar}
                    className="w-20 h-20 
              rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md 
              border border-white shadow"
                  />
                  <div>
                    <h4 className="text-lg font-bold text-[#004D40]">
                      {selectedUser.fullName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* info */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vai trò</span>
                    <span className="font-bold text-[#004D40]">
                      {selectedUser.role}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Trạng thái</span>
                    <span
                      className={`font-bold ${
                        selectedUser.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Ngày tạo</span>
                    <span className="font-medium text-[#004D40]">
                      {selectedUser.createdAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="p-6 border-l border-gray-100 space-y-6">
                {selectedUser.role === "OWNER" ? (
                  <>
                    {/* BUSINESS CARD */}
                    <div
                      className="bg-[#F5F5F5] p-4 
              rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md"
                    >
                      <p className="text-xs text-gray-400 mb-1">Doanh nghiệp</p>
                      <p className="font-bold text-[#004D40]">
                        Homestay Mây Trắng
                      </p>
                      <p className="text-sm text-gray-500">Đà Nẵng</p>
                      <span className="text-[10px] font-bold text-orange-500 mt-2 inline-block">
                        PENDING
                      </span>
                    </div>

                    {/* SUBSCRIPTION (highlight) */}
                    <div
                      className="bg-gradient-to-br from-[#004D40] to-[#00332A] 
              text-white p-5 
              rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl
              shadow-lg"
                    >
                      <p className="text-xs opacity-70">Gói hiện tại</p>
                      <h4 className="text-lg font-bold mt-1">Gói VIP</h4>

                      <div className="mt-3 text-sm space-y-1">
                        <p>Hết hạn: 30/12/2026</p>
                        <p>Thanh toán: 499.000đ</p>
                      </div>

                      <span className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                        ACTIVE
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-10">
                    Không có dữ liệu nâng cao
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 bg-[#004D40] text-white rounded-xl font-bold hover:bg-[#00332A]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <EmptyState
          title="Không tìm thấy đơn người dùng nào"
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
    </div>
  );
};

export default UserManagement;
