import User from '../models/User.js';
import Service from '../models/Service.js';
import OwnerApplication from '../models/OwnerApplication.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import clerkClient from '../utils/clerkClient.js';

// 1. API GET /api/admin/users
// Lấy danh sách người dùng (Tìm kiếm, Lọc, Phân trang)
export const getUsers = async (req, res, next) => {
    try {
        const { keyword, role, status, page = 1, limit = 5 } = req.query;

        const query = {};

        // Tìm kiếm tương đối theo tên hoặc email
        if (keyword) {
            query.$or = [
                { fullName: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (role && role !== 'ALL') query.role = role;
        if (status && status !== 'ALL') query.status = status;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Chạy song song để tối ưu tốc độ phản hồi
        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-preferences'), // Ẩn trường không cần thiết
            User.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum);

        return ApiResponse.send(res, 200, 'Lấy danh sách thành công', users, {
            totalItems: total,
            page: pageNum,
            totalPages,
            pageSize: limitNum
        });
    } catch (error) {
        next(error);
    }
};

// 2. API PATCH /api/admin/users/:id/status
// Khóa hoặc Mở khóa người dùng
export const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'BLOCKED'].includes(status)) {
            return next(new ApiError(400, 'Trạng thái không hợp lệ.'));
        }

        // 1. Cập nhật trong MongoDB
        const user = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!user) {
            return next(new ApiError(404, 'Không tìm thấy người dùng.'));
        }

        // 2. ĐỒNG BỘ TRẠNG THÁI KHÓA LÊN CLERK
        try {
            // Xác định hành động là 'ban' (khóa) hay 'unban' (mở khóa)
            const clerkAction = status === 'BLOCKED' ? 'ban' : 'unban';

            // Gọi trực tiếp API của Clerk
            const clerkRes = await fetch(`https://api.clerk.com/v1/users/${user.clerkId}/${clerkAction}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`, // Lấy key từ .env
                    'Content-Type': 'application/json'
                }
            });

            if (!clerkRes.ok) {
                // Lấy chi tiết lỗi từ Clerk nếu có
                const errorData = await clerkRes.json();
                console.error("⚠️ Clerk API báo lỗi:", errorData);
            } else {
                console.log(`🔒 Đã ${status === 'BLOCKED' ? 'khóa cứng (ban)' : 'mở khóa (unban)'} user ${user.email} trên Clerk`);
            }
        } catch (clerkErr) {
            console.error("⚠️ Không thể gọi API Clerk:", clerkErr.message);
            // Vẫn cho qua vì database của mình đã update thành công
        }

        return ApiResponse.send(
            res,
            200,
            `Tài khoản đã được ${status === 'ACTIVE' ? 'mở khóa' : 'khóa'} thành công`,
            user
        );
    } catch (error) {
        next(error);
    }
};

// 3. API GET /api/admin/users/:id
// Lấy chi tiết (Tích hợp thông tin SaaS nếu là OWNER)
export const getUserDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        // lean() giúp query nhanh hơn do chỉ lấy Object thuần
        const user = await User.findById(id).lean();

        if (!user) {
            return next(new ApiError(404, 'Không tìm thấy người dùng.'));
        }

        let extraData = {};

        // Truy xuất chéo dữ liệu nếu là Chủ dịch vụ
        if (user.role === 'OWNER') {
            const [totalServices, application] = await Promise.all([
                Service.countDocuments({ ownerId: id }),
                OwnerApplication.findOne({ userId: id }).sort({ createdAt: -1 }).lean()
            ]);

            extraData = {
                totalServices,
                businessDetails: application ? {
                    businessName: application.businessName,
                    businessAddress: application.businessAddress,
                    applicationStatus: application.status
                } : null
            };
        }

        const responseData = { ...user, ...extraData };

        return ApiResponse.send(res, 200, 'Lấy chi tiết thành công', responseData);
    } catch (error) {
        next(error);
    }
};