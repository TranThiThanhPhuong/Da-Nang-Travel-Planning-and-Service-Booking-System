import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const ImageZoomModal = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative max-w-5xl w-full">
        <motion.img
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          src={image.url}
          className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          alt={image.title || ""}
        />
        {(image.description || image.title) && (
          <p className="text-white text-center mt-4 text-sm font-medium">
            {image.description || image.title}
          </p>
        )}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-[#004D40] shadow-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ImageZoomModal;