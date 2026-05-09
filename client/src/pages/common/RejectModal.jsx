import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

const RejectModal = ({ isOpen, onClose, onReject, placeholder }) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleReject = () => {
    onReject(reason);
    setReason("");
  };

  const handleClose = () => {
    onClose();
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-white/90 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl w-full max-w-md"
      >
        <div className="flex items-center gap-3 text-[#FF5252] mb-4">
          <AlertCircle size={24} />
          <h3 className="font-bold text-lg text-[#004D40]">Lý do từ chối</h3>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder || "VD: Giấy tờ không đầy đủ, thông tin không chính xác..."}
          className="w-full h-32 bg-white/60 border-2 border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md p-4 text-sm text-[#004D40] focus:border-[#FF5252] outline-none transition-colors resize-none"
        />
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 text-[#004D40]/60 font-bold hover:text-[#004D40] transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-[#FF5252] text-white font-bold py-2.5 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md hover:bg-[#E04848] transition-colors"
          >
            GỬI PHẢN HỒI
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RejectModal;