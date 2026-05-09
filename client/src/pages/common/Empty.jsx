import { Filter } from "lucide-react";
import { motion } from "framer-motion";

const EmptyState = ({
  icon: Icon = Filter,
  title = "Không có dữ liệu",
  description = "Không tìm thấy nội dung phù hợp",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/80 backdrop-blur-[10px] p-12 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 text-center"
    >
      <Filter className="mx-auto text-[#004D40]/30 mb-4" size={48} />
      <h3 className="text-xl font-bold text-[#004D40] mb-2">{title}</h3>
      <p className="text-[#004D40]/60 text-sm">{description}</p>
    </motion.div>
  );
};

export default EmptyState;
