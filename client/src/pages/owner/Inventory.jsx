import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import InventoryCalendar from '../../components/owner/InventoryCalendar';
import BulkUpdateModal from '../../components/owner/BulkUpdateModal';
import EditInventoryModal from '../../components/owner/EditInventoryModal';

const Inventory = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedServiceId = searchParams.get('serviceId');

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get('/api/inventory/my-services', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setServices(response.data.data);

        if (preSelectedServiceId) {
          const preSelected = response.data.data.find(
            (s) => s._id === preSelectedServiceId
          );
          if (preSelected) {
            setSelectedService(preSelected);
          }
        } else if (response.data.data.length > 0) {
          setSelectedService(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Fetch services error:', error);
      alert('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedService) {
      fetchInventory();
    }
  }, [selectedService, currentYear, currentMonth]);

  // Lấy tồn kho của dịch vụ đã chọn cho tháng và năm hiện tại, sau đó truyền xuống calendar
  const fetchInventory = async () => {
    if (!selectedService) return;

    setCalendarLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(
        `/api/inventory/${selectedService._id}?year=${currentYear}&month=${currentMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('Fetch inventory error:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleServiceChange = (e) => {
    const service = services.find((s) => s._id === e.target.value);
    setSelectedService(service);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  const handleDayClick = (dayData) => {
    setSelectedDay(dayData);
    setShowEditModal(true);
  };

  const handleBulkUpdateSuccess = () => {
    fetchInventory();
    setShowBulkModal(false);
  };

  const handleEditSuccess = () => {
    fetchInventory();
    setShowEditModal(false);
  };

  const getServiceLabel = (type) => {
    switch (type) {
      case 'HOTEL':
        return 'Phòng';
      case 'RESTAURANT':
        return 'Bàn / Suất';
      case 'ACTIVITY':
        return 'Vé';
      default:
        return 'Chỗ';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004D40]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-jakarta pb-10">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-cormorant font-bold text-[#004D40]"
          >
            Quản lý Tồn kho
          </motion.h1>
          <p className="text-[#004D40]/60 mt-1 font-medium text-2sm">
            Cập nhật số lượng {selectedService && getServiceLabel(selectedService.type)} theo ngày
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBulkModal(true)}
          disabled={!selectedService}
          className="flex items-center gap-2 bg-[#004D40] hover:bg-[#00332A] text-white px-5 py-2.5 rounded-tr-[20px] rounded-bl-[20px] rounded-tl-md rounded-br-md font-bold transition-colors shadow-lg shadow-[#004D40]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} /> Cập nhật hàng loạt
        </motion.button>
      </div>

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-[10px] rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden"
      >
        {/* TOOLBAR */}
        <div className="p-6 border-b border-gray-100 bg-white/40">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* SERVICE SELECTOR */}
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-bold text-[#004D40] mb-2">
                Chọn dịch vụ
              </label>
              <select
                value={selectedService?._id || ''}
                onChange={handleServiceChange}
                className="w-full px-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-bold text-[#004D40] cursor-pointer transition-all"
              >
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name} ({service.type})
                  </option>
                ))}
              </select>
            </div>

            {/* MONTH NAVIGATOR */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-[#E0F2F1] rounded-lg transition-colors"
              >
                <ChevronLeft className="text-[#004D40]" size={20} />
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#E0F2F1] rounded-lg">
                <CalendarIcon className="text-[#004D40]" size={18} />
                <span className="font-bold text-[#004D40]">
                  Tháng {currentMonth}/{currentYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-[#E0F2F1] rounded-lg transition-colors"
              >
                <ChevronRight className="text-[#004D40]" size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="p-6">
          {calendarLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="animate-spin text-[#004D40]" size={48} />
            </div>
          ) : (
            <InventoryCalendar
              year={currentYear}
              month={currentMonth}
              inventory={inventory}
              onDayClick={handleDayClick}
              serviceType={selectedService?.type}
            />
          )}
        </div>

        {/* LEGEND */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <span className="text-xs font-bold text-gray-600">Còn nhiều (>30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-xs font-bold text-gray-600">Còn ít (≤30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs font-bold text-gray-600">Hết chỗ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-xs font-bold text-gray-600">Chưa cập nhật</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MODALS */}
      {showBulkModal && (
        <BulkUpdateModal
          serviceId={selectedService._id}
          serviceName={selectedService.name}
          serviceType={selectedService.type}
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleBulkUpdateSuccess}
        />
      )}

      {showEditModal && selectedDay && (
        <EditInventoryModal
          inventoryData={selectedDay}
          serviceType={selectedService.type}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDay(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default Inventory;