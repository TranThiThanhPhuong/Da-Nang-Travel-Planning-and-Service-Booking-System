import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  UploadCloud,
  MapPin,
  Save,
  X,
  Map as MapIcon,
  Navigation,
  Loader2,
  Tag,
  Lock,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import MapPicker from "../../components/MapPicker";
import { FEATURES_CONFIG } from "../../assets/features";

const AddService = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      name: "", type: "HOTEL", description: "", pricePerUnit: "", discount: 0,
      address: "", lat: 16.047079, lng: 108.20623, features: [],
    },
  });

  const [images, setImages] = useState(Array(8).fill(null));
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [customFeature, setCustomFeature] = useState("");

  const [quotaStatus, setQuotaStatus] = useState({ isChecking: true, reached: false, limit: 0 });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: "success", title: "", message: "" });

  const serviceType = watch("type");
  const pricePerUnit = watch("pricePerUnit");
  const discount = watch("discount");
  const getFeatureGroups = () => FEATURES_CONFIG[serviceType] || [];
  
  const calculatedFinalPrice = React.useMemo(() => {
    const price = Number(pricePerUnit) || 0;
    const disc = Number(discount) || 0;
    return price * (1 - disc / 100);
  }, [pricePerUnit, discount]);

  useEffect(() => {
    if (isEditMode) {
      fetchServiceData();
      setQuotaStatus({ isChecking: false, reached: false }); // Không khóa khi đang SỬA
    } else {
      checkSaaSQuota(); // Kiểm tra giới hạn khi THÊM MỚI
    }
  }, [id]);

  const checkSaaSQuota = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('/api/owner/saas/status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { maxServices, currentServiceCount } = response.data.data;
        if (maxServices !== -1 && currentServiceCount >= maxServices) {
          setQuotaStatus({ isChecking: false, reached: true, limit: maxServices });
        } else {
          setQuotaStatus({ isChecking: false, reached: false });
        }
      }
    } catch (error) {
      console.error("Lỗi kiểm tra gói dịch vụ:", error);
      setQuotaStatus({ isChecking: false, reached: false }); // Fallback an toàn
    }
  };

  const fetchServiceData = async () => {
    setFetchLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(`/api/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const service = response.data.data;
        reset({
          name: service.name, type: service.type, description: service.description,
          pricePerUnit: service.pricePerUnit, discount: service.discount || 0,
          address: service.address, lat: service.location.coordinates[1],
          lng: service.location.coordinates[0], features: service.features || [],
        });

        const allFeatures = Object.values(FEATURES_CONFIG[serviceType] || []).flatMap((group) => group.items.map((item) => item.value));
        const customFeatures = (service.features || []).filter((f) => !allFeatures.includes(f));
        setCustomFeature(customFeatures.join(", "));

        const loadedImages = Array(8).fill(null);
        if (service.thumbnail) loadedImages[0] = service.thumbnail;
        service.images?.slice(0, 3).forEach((img, idx) => { loadedImages[idx + 1] = img; });
        setImages(loadedImages);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tải thông tin dịch vụ");
      navigate("/owner/list-service");
    } finally {
      setFetchLoading(false);
    }
  };

  const getPriceLabel = () => {
    switch (serviceType) {
      case "HOTEL": return "Giá phòng / Đêm";
      case "RESTAURANT": return "Giá trung bình / Người";
      case "ACTIVITY": return "Giá vé / Khách";
      default: return "Giá cơ bản";
    }
  };

  const triggerFileInput = (index) => {
    setActiveSlot(index);
    fileInputRef.current.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && activeSlot !== null) {
      const preview = URL.createObjectURL(file);
      const newImages = [...images];
      newImages[activeSlot] = { file, preview };
      setImages(newImages);
    }
  };

  const removeImage = (index, e) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const handleCoordinatesChange = (lat, lng) => {
    setValue("lat", lat);
    setValue("lng", lng);
  };

  const handleAddressChange = (newAddress) => {
    setValue("address", newAddress);
  };

  const handleArrayToggle = (fieldName, value) => {
    const current = watch(fieldName) || [];
    if (current.includes(value)) {
      setValue(fieldName, current.filter((v) => v !== value));
    } else {
      setValue(fieldName, [...current, value]);
    }
  };

  const onSubmit = async (data) => {
    if (quotaStatus.reached) return; // Bảo vệ nút submit nếu bị hack disabled

    setLoading(true);
    try {
      const token = await getToken();
      const uploadedImages = [];
      let thumbnailUrl = "";

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img) continue;
        if (typeof img === "string") {
          uploadedImages.push(img);
          if (i === 0) thumbnailUrl = img;
          continue;
        }

        if (img.file) {
          const formData = new FormData();
          formData.append("files", img.file);
          formData.append("metadata", JSON.stringify([{ type: "SERVICE_IMAGE", title: `Image ${i + 1}` }]));

          const uploadRes = await axios.post("/api/owner-applications/upload", formData, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
          });

          if (uploadRes.data.success && uploadRes.data.data.length > 0) {
            const uploadedUrl = uploadRes.data.data[0].url;
            uploadedImages.push(uploadedUrl);
            if (i === 0) thumbnailUrl = uploadedUrl;
          }
        }
      }

      if (!thumbnailUrl) {
        alert("Vui lòng tải ít nhất 1 ảnh bìa (slot đầu tiên)");
        setLoading(false);
        return;
      }

      const selectedFeatures = data.features || [];
      const customFeaturesList = customFeature ? customFeature.split(",").map((item) => item.trim()).filter(Boolean) : [];
      const uniqueFeatures = [...new Set([...selectedFeatures, ...customFeaturesList])];

      const serviceData = {
        name: data.name, type: data.type, description: data.description,
        pricePerUnit: Number(data.pricePerUnit), discount: Number(data.discount) || 0,
        address: data.address, coordinates: [Number(data.lng), Number(data.lat)],
        thumbnail: thumbnailUrl, images: uploadedImages.slice(1), features: uniqueFeatures,
      };

      let response;
      if (isEditMode) {
        response = await axios.put(`/api/services/${id}`, serviceData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        response = await axios.post("/api/services", serviceData, { headers: { Authorization: `Bearer ${token}` } });
      }

      if (response.data.success) {
        alert(isEditMode ? "✅ Cập nhật dịch vụ thành công!" : "✅ Tạo dịch vụ thành công! Đang chờ Admin duyệt.");
        navigate("/owner/list-service");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading || quotaStatus.isChecking) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004D40]" size={48} />
      </div>
    );
  }

  const inputStyle = "w-full px-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-bold text-[#004D40] placeholder-[#004D40]/40 transition-all";

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-jakarta pb-10">

      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-cormorant font-bold text-[#004D40]">
            {isEditMode ? "Chỉnh sửa Dịch vụ" : "Thêm Dịch vụ Mới"}
          </motion.h1>
          <p className="text-[#004D40]/60 mt-1 font-medium text-sm">Điền thông tin và thả ghim vị trí để đăng tải lên nền tảng.</p>
        </div>
        <motion.button
          whileHover={{ scale: quotaStatus.reached ? 1 : 1.05 }}
          whileTap={{ scale: quotaStatus.reached ? 1 : 0.95 }}
          onClick={handleSubmit(onSubmit)}
          disabled={quotaStatus.reached || loading}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-tr-[20px] rounded-bl-[20px] rounded-tl-md rounded-br-md font-bold transition-all shadow-lg ${quotaStatus.reached ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#004D40] hover:bg-[#00332A] text-white shadow-[#004D40]/20'}`}
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> {isEditMode ? "Đang cập nhật..." : "Đang tạo..."}</>
          ) : (
            <><Save size={20} /> {isEditMode ? "Cập nhật" : "Lưu & Gửi duyệt"}</>
          )}
        </motion.button>
      </div>

      {/* KHU VỰC FORM CHÍNH (CÓ TÍCH HỢP LỚP PHỦ OVERLAY MỜ NẾU HẾT QUOTA) */}
      <div className="relative">

        {/* LỚP PHỦ OVERLAY KHI ĐẠT GIỚI HẠN */}
        {quotaStatus.reached && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md rounded-[40px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 md:p-10 rounded-[32px] shadow-2xl max-w-md text-center border border-gray-100 m-4"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Lock size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-[#004D40] mb-3">Giới hạn dịch vụ!</h2>
              <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                Gói hiện tại của bạn chỉ cho phép đăng tối đa <strong>{quotaStatus.limit}</strong> dịch vụ. Để mở rộng kinh doanh và tiếp cận nhiều khách hàng hơn, hãy nâng cấp tài khoản nhé!
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/owner/subscription')}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                >
                  <Crown size={18} /> Nâng cấp gói ngay
                </button>
                <button
                  onClick={() => navigate('/owner/list-service')}
                  className="w-full text-gray-500 font-bold py-3 hover:bg-gray-50 rounded-xl transition-colors text-sm"
                >
                  Quay lại danh sách
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* THÂN FORM (Bị làm mờ và vô hiệu hóa click nếu hết Quota) */}
        <form className={`grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-500 ${quotaStatus.reached ? 'opacity-30 pointer-events-none select-none blur-[2px]' : ''}`}>

          {/* CỘT TRÁI */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <h2 className="text-xl font-cormorant font-bold text-[#004D40] border-b border-[#004D40]/10 pb-3 mb-5">Thông tin chung</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-[#004D40] mb-1.5">Tên dịch vụ <span className="text-[#FFAB40]">*</span></label>
                  <input {...register("name", { required: true })} type="text" placeholder="VD: Khách sạn Mường Thanh, Quán nướng Hàn Quốc..." className={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-[#004D40] mb-1.5">Loại hình <span className="text-[#FFAB40]">*</span></label>
                    <select {...register("type")} className={inputStyle}>
                      <option value="HOTEL">Lưu trú (Khách sạn)</option>
                      <option value="RESTAURANT">Ẩm thực (Nhà hàng)</option>
                      <option value="ACTIVITY">Trải nghiệm (Tour)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#004D40] mb-1.5">{getPriceLabel()} (VNĐ) <span className="text-[#FFAB40]">*</span></label>
                    <input {...register("pricePerUnit", { required: true })} type="number" placeholder="0" className={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#004D40] mb-1.5">Khuyến mãi (%)</label>
                    <input {...register("discount", { min: 0, max: 100 })} type="number" placeholder="0" className={inputStyle} />
                  </div>
                </div>
                <div className="p-4 bg-[#E0F2F1]/40 border border-[#004D40]/10 rounded-tr-2xl rounded-bl-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-[#004D40]/70">Giá thực tế hiển thị cho khách hàng:</span>
                  <span className="text-lg font-black text-[#004D40]">
                    {calculatedFinalPrice.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#004D40] mb-1.5">Mô tả chi tiết <span className="text-[#FFAB40]">*</span></label>
                  <textarea {...register("description")} rows="10" placeholder="Mô tả điểm nổi bật, dịch vụ cung cấp..." className={`${inputStyle} min-h-[260px] leading-7 font-medium resize-y`} />
                </div>
              </div>
            </motion.div>

            {/* Vị trí */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <h2 className="text-xl font-cormorant font-bold text-[#004D40] border-b border-[#004D40]/10 pb-3 mb-5">Vị trí trên bản đồ</h2>
              <MapPicker lat={watch("lat")} lng={watch("lng")} address={watch("address")} onCoordinatesChange={handleCoordinatesChange} onAddressChange={handleAddressChange} />
            </motion.div>
          </div>

          {/* CỘT PHẢI */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <div className="flex justify-between items-center border-b border-[#004D40]/10 pb-3 mb-5">
                <h2 className="text-xl font-cormorant font-bold text-[#004D40]">Album Hình ảnh</h2>
                <span className="text-xs font-bold bg-[#E0F2F1] text-[#004D40] px-3 py-1 rounded-full">Tối đa 8 ảnh</span>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => {
                  const imgSrc = typeof img === "string" ? img : img?.preview || null;
                  return (
                    <div key={index} onClick={() => !imgSrc && triggerFileInput(index)} className={`relative aspect-square rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center transition-all ${imgSrc ? "border-transparent shadow-sm" : "border-dashed border-[#004D40]/20 bg-white/50 hover:bg-[#E0F2F1]/50 hover:border-[#FFAB40] cursor-pointer"}`}>
                      {imgSrc ? (
                        <>
                          <img src={imgSrc} alt={`upload-${index}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={(e) => removeImage(index, e)} className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white p-1 rounded-full text-[#004D40] transition-colors shadow-sm"><X size={12} strokeWidth={3} /></button>
                          {index === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#004D40]/80 text-[#FFAB40] text-[8px] text-center py-1 font-bold uppercase">BÌA</div>}
                        </>
                      ) : (
                        <><UploadCloud className="text-[#004D40]/30 mb-1" size={20} /><span className="text-[8px] text-[#004D40]/60 font-bold">Ảnh {index + 1}</span></>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Tiện ích */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
              <div className="flex items-center gap-3 border-b border-[#004D40]/10 pb-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-[#004D40]/10 flex items-center justify-center"><Tag className="text-[#004D40]" size={18} /></div>
                <div>
                  <h2 className="text-xl font-cormorant font-bold text-[#004D40]">Tiện ích & Đặc điểm</h2>
                  <p className="text-xs text-[#004D40]/50 font-medium">Chọn các đặc điểm phù hợp</p>
                </div>
              </div>
              <div className="space-y-5">
                {getFeatureGroups().map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-bold text-[#004D40] mb-3">{group.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((feature) => {
                        const selected = (watch("features") || []).includes(feature.value);
                        return (
                          <button key={feature.value} type="button" onClick={() => handleArrayToggle("features", feature.value)} className={`px-4 py-2 rounded-tr-[20px] rounded-bl-[20px] rounded-tl-md rounded-br-md text-xs font-bold transition-all border ${selected ? "bg-[#004D40] text-white border-[#004D40]" : "bg-white text-[#004D40]/70 border-[#004D40]/10"}`}>
                            {feature.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-bold text-[#004D40] mb-2">Tiện ích khác</label>
                <textarea rows="4" value={customFeature} onChange={(e) => setCustomFeature(e.target.value)} placeholder="VD: - Cho thuê xe máy..." className={`${inputStyle} min-h-[120px] leading-6 resize-y`} />
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddService;