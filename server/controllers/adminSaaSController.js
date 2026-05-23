import SubscriptionPackage from '../models/SubscriptionPackage.js';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// 1. Lấy danh sách 3 gói phục vụ quản trị và hiển thị cấu hình bán
export const adminGetPackages = async (req, res, next) => {
    try {
        const packages = await SubscriptionPackage.find().sort({ price: 1 });
        return ApiResponse.send(res, 200, 'Lấy danh sách cấu hình gói thành công.', packages);
    } catch (error) {
        next(error);
    }
};

// 2. Cập nhật thông số giá trị gói (CHỈ CHO PHÉP SỬA GIÁ)
export const adminUpdatePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        if (price === undefined || price < 0) {
            throw new ApiError(400, 'Giá tiền không hợp lệ.');
        }

        // Tìm gói cần sửa
        const packageToUpdate = await SubscriptionPackage.findById(id);
        if (!packageToUpdate) throw new ApiError(404, 'Không tìm thấy gói dịch vụ yêu cầu.');

        if (packageToUpdate.packageCode === 'STARTER' && Number(price) !== 0) {
            throw new ApiError(400, 'Lỗi bảo mật: Gói STARTER bắt buộc phải miễn phí (0đ).');
        }

        // Lấy các gói khác để so sánh giá
        const allPackages = await SubscriptionPackage.find();
        const proPkg = allPackages.find(p => p.packageCode === 'PRO');
        const ultPkg = allPackages.find(p => p.packageCode === 'ULTIMATE');

        if (packageToUpdate.packageCode === 'PRO' && ultPkg && Number(price) >= ultPkg.price) {
            throw new ApiError(400, `Giá gói PRO phải THẤP HƠN gói ULTIMATE (${ultPkg.price} đ).`);
        }
        if (packageToUpdate.packageCode === 'ULTIMATE' && proPkg && Number(price) <= proPkg.price) {
            throw new ApiError(400, `Giá gói ULTIMATE phải CAO HƠN gói PRO (${proPkg.price} đ).`);
        }

        // Tiến hành lưu giá mới
        packageToUpdate.price = Number(price);
        await packageToUpdate.save();

        return ApiResponse.send(res, 200, 'Cập nhật giá gói thành công.', packageToUpdate);
    } catch (error) {
        next(error);
    }
};

// 3. Thống kê lịch sử dòng tiền doanh thu SaaS Admin thu về
export const adminGetSaaSTransactions = async (req, res, next) => {
    try {
        const transactions = await SubscriptionTransaction.find()
            .populate('ownerId', 'fullName email')
            .populate('packageId', 'name')
            .sort({ createdAt: -1 });

        return ApiResponse.send(res, 200, 'Lấy lịch sử giao dịch SaaS thành công.', transactions);
    } catch (error) {
        next(error);
    }
};