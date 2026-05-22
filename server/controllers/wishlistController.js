import Wishlist from '../models/Wishlist.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// POST /api/wishlists/toggle
// Nếu đã lưu thì xóa, chưa lưu thì thêm mới
export const toggleWishlist = async (req, res, next) => {
    try {
        const { serviceId } = req.body;
        const userId = req.user._id;

        const existingItem = await Wishlist.findOne({ userId, serviceId });

        if (existingItem) {
            // Đã lưu -> Bấm trái tim để xóa
            await Wishlist.findByIdAndDelete(existingItem._id);
            return ApiResponse.send(res, 200, 'Đã gỡ dịch vụ khỏi danh sách yêu thích.', { isSaved: false });
        } else {
            // Chưa lưu -> Bấm trái tim để lưu
            await Wishlist.create({ userId, serviceId });
            return ApiResponse.send(res, 201, 'Đã thêm dịch vụ vào danh sách yêu thích.', { isSaved: true });
        }
    } catch (error) {
        next(error);
    }
};

// GET /api/wishlists/my-wishlists
export const getMyWishlist = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const wishlists = await Wishlist.find({ userId })
            .populate('serviceId', 'name thumbnail address type finalPrice price discount ratingStats features description')
            .sort({ createdAt: -1 });

        // Làm sạch dữ liệu: Bóc tách lớp vỏ Wishlist ra, chỉ trả về một mảng chứa toàn bộ object Service (Bỏ qua các service bị Admin xóa khỏi hệ thống)
        const formattedList = wishlists
            .map(item => item.serviceId)
            .filter(service => service !== null);

        return ApiResponse.send(res, 200, 'Lấy danh sách yêu thích thành công.', formattedList);
    } catch (error) {
        next(error);
    }
};