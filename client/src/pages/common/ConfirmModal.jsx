import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/90 backdrop-blur-[10px] p-8 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl w-full max-w-md text-center shadow-2xl"
      >
        <div className="w-16 h-16 bg-[#00C853]/20 text-[#00C853] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} />
        </div>
        <h3 className="text-2xl font-cormorant font-bold text-[#004D40] mb-2">
          {title}
        </h3>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[#004D40]/60 font-bold hover:text-[#004D40] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#00C853] hover:bg-[#00B248] text-white font-bold py-2.5 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md transition-colors"
          >
            Đồng ý
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;