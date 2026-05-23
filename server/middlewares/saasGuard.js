import User from '../models/User.js';
import Service from '../models/Service.js';
import SubscriptionPackage from '../models/SubscriptionPackage.js';
import ApiError from '../utils/ApiError.js';

export const checkServiceQuota = async (req, res, next) => {
    try {
        const ownerId = req.user._id;

        // 1. Lấy thông tin user hiện tại
        const user = await User.findById(ownerId);
        const packageCode = user.currentPackage || 'STARTER';

        // 2. Kéo cấu hình gói tương ứng từ hệ thống
        const saasPackage = await SubscriptionPackage.findOne({ packageCode });
        if (!saasPackage) {
            throw new ApiError(500, 'Lỗi hệ thống: Không tìm thấy cấu hình gói dịch vụ.');
        }

        // 3. Kiểm tra giới hạn (Nếu maxServices là -1 thì bỏ qua vì là Không giới hạn)
        if (saasPackage.maxServices !== -1) {
            // Đếm số lượng dịch vụ mà Owner này đang sở hữu (Tính cả cái đang chờ duyệt, tạm ẩn)
            const currentServiceCount = await Service.countDocuments({ ownerId });

            if (currentServiceCount >= saasPackage.maxServices) {
                throw new ApiError(
                    403,
                    `Đã đạt giới hạn! Gói ${saasPackage.name} của bạn chỉ cho phép tạo tối đa ${saasPackage.maxServices} dịch vụ. Vui lòng nâng cấp gói để tiếp tục.`
                );
            }
        }

        // Gắn tên gói vào request để Controller phía sau lưu vào bảng Service (phục vụ tối ưu tìm kiếm)
        req.ownerPackageCode = packageCode;

        next();
    } catch (error) {
        next(error);
    }
};