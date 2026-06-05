import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// @desc    Lưu từ khóa tìm kiếm vào sở thích (preferences) của User
// @route   POST /api/users/save-search
// @access  Private (Chỉ user đã đăng nhập)
export const saveUserSearchKeyword = async (req, res, next) => {
    try {
        const { keyword } = req.body;
        const userId = req.user._id;

        // Bắn lỗi qua middleware errorHandler nếu từ khóa rỗng
        if (!keyword || keyword.trim() === '') {
            throw new ApiError(400, 'Từ khóa tìm kiếm không hợp lệ.');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, 'Không tìm thấy thông tin người dùng.');
        }

        // Lấy danh sách preferences hiện tại
        let currentPrefs = user.preferences || [];
        const normalizedKeyword = keyword.trim();

        // Xóa từ khóa trùng lặp nếu nó đã từng được gõ trước đó
        currentPrefs = currentPrefs.filter(p => p.toLowerCase() !== normalizedKeyword.toLowerCase());

        // Đẩy từ khóa mới vào đầu mảng
        currentPrefs.unshift(normalizedKeyword);

        // Chỉ giữ lại tối đa 10 từ khóa
        user.preferences = currentPrefs.slice(0, 10);
        await user.save();

        return ApiResponse.send(res, 200, 'Đã cập nhật sở thích tìm kiếm.');
    } catch (error) {
        next(error);
    }
};