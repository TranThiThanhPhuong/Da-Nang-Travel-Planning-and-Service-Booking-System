import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
    DollarSign,
    TrendingUp,
    Eye,
    RotateCcw,
    CheckCircle2,
    X,
    AlertCircle,
    Loader2,
    Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import FeedbackModal from "../common/FeedbackModal";
import RejectModal from "../common/RejectModal";
import Pagination from "../common/Pagination"; // Import component phân trang dùng chung của hệ thống
import api from "../../hooks/axios";

const Finance = () => {
    const { getToken } = useAuth();

    // --- 1. STATE QUẢN LÝ DỮ LIỆU & PHÂN TRANG ---
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10; // Đồng bộ với limit mặc định ở backend

    // --- 2. STATE BỘ LỌC TÌM KIẾM ---
    const [filter, setFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    // --- 3. STATE UI (MODAL) ---
    const [selectedTxn, setSelectedTxn] = useState(null);
    const [feedback, setFeedback] = useState({ isOpen: false, type: "info", title: "", message: "" });
    const [showConfirmPay, setShowConfirmPay] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);

    // Reset trang về 1 mỗi khi thay đổi bộ lọc hoặc từ khóa tìm kiếm
    useEffect(() => {
        setPage(1);
    }, [filter, searchTerm]);

    // Định dạng ngày thông minh ưu tiên paidAt của dữ liệu thủ công
    const displayDate = (txn) => {
        if (!txn) return "N/A";

        // Ưu tiên số 1: Trực tiếp sử dụng paidAt (nạp tay thủ công thường có trường này)
        // Ưu tiên số 2: Các trường thời gian khác của tài liệu
        const rawDate = txn.paidAt || txn.createdAt || txn.date || txn.updatedAt;
        if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString("vi-VN");
            }
        }

        // Ưu tiên số 3: Fallback giải mã trực tiếp từ ObjectId của MongoDB
        if (txn._id && txn._id.length === 24) {
            try {
                const timestamp = parseInt(txn._id.substring(0, 8), 16) * 1000;
                const d = new Date(timestamp);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString("vi-VN");
                }
            } catch (e) {
                console.error("Lỗi khi trích xuất ngày tạo từ ObjectId:", e);
            }
        }

        return "N/A";
    };

    // Load danh sách giao dịch đính kèm Clerk Token & Phân trang thực tế
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const res = await api.get(`/api/admin/finance/transactions?status=${filter}&search=${searchTerm}&page=${page}&limit=${pageSize}`);
            const resJson = res.data;
            setTransactions(resJson.data || []);
            setTotalItems(resJson.totalItems || 0);
            setTotalPages(resJson.totalPages || 1);
        } catch (err) {
            setFeedback({
                isOpen: true,
                type: "error",
                title: "Lỗi kết nối",
                message: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    // Tự động gọi lại API khi bất kỳ tham số truy vấn nào thay đổi
    useEffect(() => {
        fetchTransactions();
    }, [page, filter, searchTerm]);

    // Xác nhận thanh toán thủ công đính kèm Clerk Token
    const handleConfirmPayment = async () => {
        if (!selectedTxn) return;
        try {
            setShowConfirmPay(false);
            const res = await api.patch(`/api/admin/finance/transactions/${selectedTxn._id}/confirm`);

            setFeedback({
                isOpen: true,
                type: "success",
                title: "Xác nhận thành công",
                message: "Hệ thống đã kích hoạt thủ công tài khoản và nâng gói cho đối tác.",
            });
            setSelectedTxn(null);
            fetchTransactions();
        } catch (err) {
            setFeedback({
                isOpen: true,
                type: "error",
                title: "Cập nhật thất bại",
                message: err.message,
            });
        }
    };

    // Hoàn tiền thủ công đính kèm Clerk Token
    const handleRefund = async (reason) => {
        if (!selectedTxn) return;
        if (!reason.trim()) {
            alert("Vui lòng cung cấp lý do hoàn trả!");
            return;
        }

        try {
            setShowRefundModal(false);
            const res = await api.post(`/api/admin/finance/transactions/${selectedTxn._id}/refund`, { reason });

            setFeedback({
                isOpen: true,
                type: "success",
                title: "Đã hoàn trả tiền",
                message: "Hệ thống đã ghi nhận hoàn tiền, tự động hạ cấp tài khoản và ẩn các dịch vụ thừa của đối tác.",
            });
            setSelectedTxn(null);
            fetchTransactions();
        } catch (err) {
            setFeedback({
                isOpen: true,
                type: "error",
                title: "Hoàn trả thất bại",
                message: err.message,
            });
        }
    };

    const chartData = transactions
        .filter((t) => t.status === "PAID")
        .map((t) => ({
            date: displayDate(t),
            amount: t.amount,
        }))
        .reverse();

    const totalRevenue = transactions
        .filter((t) => t.status === "PAID")
        .reduce((sum, item) => sum + item.amount, 0);

    const stats = [
        {
            title: "Tổng Doanh Thu (Hệ thống)",
            value: `${totalRevenue.toLocaleString()}đ`,
            trend: "Doanh thu thực tế thành công",
            icon: <DollarSign size={24} />,
            color: "text-[#00C853]",
        },
        {
            title: "Số Giao Dịch",
            value: transactions.length,
            trend: "Tất cả các trạng thái",
            icon: <TrendingUp size={24} />,
            color: "text-[#FFAB40]",
        },
    ];

    return (
        <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
            {/* HEADER */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-black text-[#004D40]">Quản Lý Tài Chính</h1>
                    <p className="text-sm text-gray-500 font-medium">Theo dõi hóa đơn SaaS, phê duyệt thanh toán & hỗ trợ hoàn trả tiền thủ công</p>
                </div>
            </motion.div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/60 shadow-sm relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform ${s.color}`}>
                            {s.icon}
                        </div>
                        <p className="text-[#004D40]/60 text-xs font-bold uppercase tracking-widest">{s.title}</p>
                        <h2 className="text-3xl font-black mt-2 text-[#004D40]">{s.value}</h2>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs text-[#004D40]/60 font-medium italic">{s.trend}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* BIỂU ĐỒ TRỰC QUAN */}
            {chartData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/60 shadow-sm"
                >
                    <h3 className="font-bold text-[#004D40] mb-6 flex items-center gap-2 uppercase text-sm tracking-widest">
                        <TrendingUp size={18} className="text-[#FFAB40]" />
                        Dòng tiền hoàn tất giao dịch gần đây
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#004D40" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#004D40" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
                                <XAxis dataKey="date" stroke="#004D40" fontSize={12} />
                                <YAxis stroke="#004D40" fontSize={12} tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} />
                                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "12px" }} />
                                <Area type="monotone" dataKey="amount" stroke="#004D40" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* BẢNG GIAO DỊCH CHÍNH */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/60 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <h3 className="font-bold text-[#004D40] uppercase text-sm tracking-widest">Lịch sử giao dịch</h3>
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã GD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-xs px-3 py-1.5 rounded-lg focus:outline-[#004D40]"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {["ALL", "PAID", "PENDING", "CANCELLED"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-tr-lg rounded-bl-lg rounded-tl-sm rounded-br-sm text-xs font-bold transition-all border ${filter === f
                                    ? "bg-[#004D40] border-[#004D40] text-white"
                                    : "bg-white/60 border-[#E0F2F1] text-[#004D40]/60 hover:text-[#004D40]"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto relative min-h-[250px]">
                    {loading && (
                        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#004D40]" size={32} />
                        </div>
                    )}

                    {transactions.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#004D40]/5 text-[#004D40] text-xs uppercase">
                                    <th className="px-6 py-4 text-left font-bold">Mã GD / Ngày tạo</th>
                                    <th className="px-6 py-4 text-left font-bold">Chủ đối tác (Owner)</th>
                                    <th className="px-6 py-4 text-left font-bold">Gói dịch vụ</th>
                                    <th className="px-6 py-4 text-left font-bold">Số tiền</th>
                                    <th className="px-6 py-4 text-left font-bold">Trạng thái</th>
                                    <th className="px-6 py-4 text-right font-bold">Xem / Duyệt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((txn) => (
                                    <tr key={txn._id} className="hover:bg-[#E0F2F1]/40 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-xs text-[#004D40] font-bold">{txn.transactionCode}</p>
                                            <p className="text-xs text-[#004D40]/60 mt-1">
                                                {displayDate(txn)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-[#004D40] text-sm">
                                                {txn.ownerId?.fullName || "Chưa thiết lập tên"}
                                            </p>
                                            <p className="text-xs text-[#004D40]/60 italic">{txn.ownerId?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 uppercase text-xs font-bold text-[#FFAB40]">
                                            {txn.packageCode}
                                        </td>
                                        <td className="px-6 py-4 font-black text-[#004D40]">
                                            {txn.amount.toLocaleString()}đ
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold border ${txn.status === "PAID"
                                                    ? "bg-[#00C853]/10 text-[#00C853] border-[#00C853]/20"
                                                    : txn.status === "CANCELLED"
                                                        ? "bg-[#FF5252]/10 text-[#FF5252] border-[#FF5252]/20"
                                                        : "bg-[#FFAB40]/10 text-[#FFAB40] border-[#FFAB40]/20"
                                                    }`}
                                            >
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedTxn(txn)}
                                                className="p-2 hover:bg-[#004D40]/10 text-[#004D40] rounded-lg transition"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        !loading && <div className="p-12 text-center text-gray-400">Không tìm thấy dữ liệu giao dịch phù hợp.</div>
                    )}
                </div>
            </motion.div>

            {/* PHÂN TRANG (Tích hợp component Pagination của dự án) */}
            {transactions.length > 0 && totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setPage}
                />
            )}

            {/* MODAL CHI TIẾT GIAO DỊCH */}
            <AnimatePresence>
                {selectedTxn && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-2xl border border-gray-100"
                        >
                            <div className="p-6 border-b border-[#E0F2F1] flex justify-between items-center bg-[#004D40]/5">
                                <h2 className="text-lg font-bold text-[#004D40] uppercase tracking-wider">Chi tiết hóa đơn</h2>
                                <button onClick={() => setSelectedTxn(null)} className="text-[#004D40]/60 hover:text-[#004D40]">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="text-center pb-6 border-b border-[#E0F2F1]">
                                    <p className="text-xs font-bold text-[#004D40]/60 uppercase">Tổng số tiền thanh toán</p>
                                    <h1 className="text-4xl font-black text-[#004D40] mt-2">
                                        {selectedTxn.amount.toLocaleString()}đ
                                    </h1>
                                </div>

                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div>
                                        <p className="text-xs text-[#004D40]/60 uppercase font-bold">Mã Giao dịch</p>
                                        <p className="text-[#004D40] font-mono font-bold text-xs">{selectedTxn.transactionCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#004D40]/60 uppercase font-bold">Gói đăng ký</p>
                                        <p className="text-[#FFAB40] font-bold text-xs uppercase">{selectedTxn.packageCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#004D40]/60 uppercase font-bold">Đối tác</p>
                                        <p className="text-[#004D40] font-bold">{selectedTxn.ownerId?.fullName || "Chưa xác lập"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#004D40]/60 uppercase font-bold">Thời gian tạo</p>
                                        <p className="text-[#004D40]">{displayDate(selectedTxn)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-[#004D40]/60 uppercase font-bold">Trạng thái hiện tại</p>
                                        <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-xs font-bold text-gray-700 rounded-full">
                                            {selectedTxn.status}
                                        </span>
                                    </div>
                                </div>

                                {/* KHU VỰC THAO TÁC THỦ CÔNG */}
                                <div className="border-t border-[#E0F2F1] pt-6 flex flex-col gap-3">
                                    {selectedTxn.status === "PENDING" && (
                                        <button
                                            onClick={() => setShowConfirmPay(true)}
                                            className="w-full flex items-center justify-center gap-2 bg-[#004D40] hover:bg-[#00332a] text-white py-3 rounded-xl font-bold text-xs transition shadow-lg"
                                        >
                                            <Check size={16} /> DUYỆT / XÁC NHẬN ĐÃ THANH TOÁN (THỦ CÔNG)
                                        </button>
                                    )}

                                    {selectedTxn.status === "PAID" && (
                                        <div className="p-4 bg-[#FF5252]/5 border border-[#FF5252]/20 rounded-tr-[24px] rounded-bl-[24px] rounded-tl-xl rounded-br-xl">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="text-[#FF5252] shrink-0" size={18} />
                                                <div className="flex-1">
                                                    <h4 className="text-xs font-bold text-[#004D40]">Khu vực hoàn tiền & hạ cấp dịch vụ</h4>
                                                    <p className="text-[11px] text-[#004D40]/60 mt-0.5">
                                                        Khi hoàn trả, hệ thống sẽ hạ cấp cơ sở dôi dư của chủ đối tác về gói STARTER.
                                                    </p>
                                                    <button
                                                        onClick={() => setShowRefundModal(true)}
                                                        className="mt-3 flex items-center gap-2 text-xs font-bold text-[#FF5252] hover:text-[#E04848] transition"
                                                    >
                                                        <RotateCcw size={14} /> TIẾN HÀNH HOÀN TIỀN (REFUND)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CONFIRM PAY MODAL (THỦ CÔNG) */}
            <AnimatePresence>
                {showConfirmPay && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white p-8 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl w-full max-w-sm text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-[#004D40]/10 text-[#004D40] rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[#004D40] mb-2">Duyệt thanh toán tay?</h3>
                            <p className="text-gray-500 text-xs mb-8">
                                Bạn xác nhận đối tác đã thanh toán thành công số tiền{" "}
                                <strong className="text-[#004D40]">{selectedTxn?.amount.toLocaleString()}đ</strong> bằng hình thức chuyển khoản trực tiếp.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowConfirmPay(false)} className="flex-1 py-2.5 text-gray-500 font-bold hover:text-gray-700 transition text-xs">
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    className="flex-1 bg-[#004D40] hover:bg-[#00332a] text-white font-bold py-2.5 rounded-xl transition shadow-lg text-xs"
                                >
                                    Đồng ý Duyệt
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* REJECT/REFUND REASON MODAL */}
            <AnimatePresence>
                {showRefundModal && (
                    <RejectModal
                        isOpen={showRefundModal}
                        onClose={() => setShowRefundModal(false)}
                        onReject={handleRefund}
                        placeholder="Nhập lý do hoàn phí dịch vụ (Ví dụ: Đối tác chuyển khoản nhầm gói, lỗi webhook hệ thống...)"
                    />
                )}
            </AnimatePresence>

            {/* FEEDBACK MODAL THÔNG BÁO HOÀN TẤT */}
            <FeedbackModal
                isOpen={feedback.isOpen}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback({ ...feedback, isOpen: false })}
            />
        </div>
    );
};

export default Finance;