import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-[10px] p-5 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow border border-white/60 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      {/* TEXT */}
      <p className="text-sm font-medium text-[#004D40]/70">
        Hiển thị <span className="font-bold text-[#004D40]">{start}</span> đến{" "}
        <span className="font-bold text-[#004D40]">{end}</span> của{" "}
        <span className="font-bold text-[#004D40]">{totalItems}</span> đơn
      </p>

      {/* BUTTONS */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 rounded-lg border border-[#E0F2F1] text-[#004D40] hover:bg-[#E0F2F1] disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
              p === page
                ? "bg-[#004D40] text-white"
                : "border border-[#E0F2F1] text-[#004D40] hover:bg-[#E0F2F1]"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-[#E0F2F1] text-[#004D40] hover:bg-[#E0F2F1] disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default Pagination;
