import React, { useState, useEffect } from 'react';
import axios from '../../hooks/axios'
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Star, MapPin, HeartCrack } from 'lucide-react';

const WishlistGrid = () => {
    const { getToken } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const token = await getToken();
                const res = await axios.get('/api/wishlists/my-wishlists', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = res.data?.data || [];
                setWishlist(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Lỗi khi tải danh sách yêu thích:', error);
                setWishlist([]);
                toast.error('Không thể tải danh sách yêu thích.');
            } finally {
                setLoading(false);
            }
        };
        fetchWishlist();
    }, [getToken]);

    const handleRemoveItem = async (serviceId) => {
        try {
            const token = await getToken();
            await axios.post('/api/wishlists/toggle',
                { serviceId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Xóa item khỏi giao diện ngay lập tức để tạo cảm giác mượt mà
            setWishlist(prev => prev.filter(item => item._id !== serviceId));
            toast.success('Đã gỡ khỏi danh sách yêu thích');
        } catch (error) {
            console.error('Lỗi khi xóa yêu thích:', error);
            toast.error('Không thể xóa dịch vụ này.');
        }
    };

    if (loading) {
        return <div className="text-center py-20"><div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
    }

    if (wishlist.length === 0) {
        return (
            <div className="text-center py-20 flex flex-col items-center bg-gray-50 rounded-2xl border border-gray-100">
                <HeartCrack size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-[#004D40] mb-2">Danh sách trống</h3>
                <p className="text-sm font-medium text-gray-500">Bạn chưa lưu dịch vụ nào vào danh sách yêu thích.</p>
                <Link to="/services" className="mt-6 px-6 py-3 bg-[#004D40] text-white font-bold rounded-xl hover:bg-[#002b24] transition-colors">Khám phá ngay</Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
                {wishlist.map((service) => (
                    <motion.div
                        key={service._id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all group relative flex flex-col"
                    >
                        <button
                            onClick={() => handleRemoveItem(service._id)}
                            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur p-2 rounded-full shadow-md text-red-500 hover:bg-red-50 hover:scale-110 transition-all"
                            title="Xóa khỏi danh sách"
                        >
                            <HeartCrack size={18} />
                        </button>

                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={service.thumbnail}
                                alt={service.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4 bg-[#004D40] text-[#FFAB40] px-3 py-1 rounded-tr-lg rounded-bl-lg text-[10px] font-black tracking-widest uppercase shadow-md">
                                {service.type}
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-[#004D40] line-clamp-1 flex-1 pr-2" title={service.name}>
                                    {service.name}
                                </h3>
                                <div className="flex items-center gap-1 bg-[#FFF8E1] px-2 py-1 rounded-md">
                                    <Star size={12} className="fill-[#FFAB40] text-[#FFAB40]" />
                                    <span className="text-xs font-black text-[#004D40]">{service.ratingStats?.averageRating || 5.0}</span>
                                </div>
                            </div>

                            <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-4 line-clamp-1">
                                <MapPin size={14} /> {service.address}
                            </p>

                            <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                <div>
                                    {service.discount > 0 && (
                                        <div className="text-[10px] line-through text-gray-400 font-medium">
                                            {service.price?.toLocaleString('vi-VN')} đ
                                        </div>
                                    )}
                                    <div className="text-lg font-black text-[#FFAB40]">
                                        {service.finalPrice?.toLocaleString('vi-VN')} đ
                                    </div>
                                </div>
                                <Link
                                    to={`/services/${service._id}`}
                                    className="text-xs font-bold bg-[#004D40] text-white px-4 py-2 rounded-lg hover:bg-[#002b24] transition-colors"
                                >
                                    Xem chi tiết
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default WishlistGrid;