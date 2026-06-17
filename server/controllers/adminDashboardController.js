import User from '../models/User.js';
import Service from '../models/Service.js';
import OwnerApplication from '../models/OwnerApplication.js';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import ApiResponse from '../utils/ApiResponse.js';

export const getDashboardStats = async (req, res, next) => {
    try {
        // 1. Thống kê nhanh các con số chính
        const [totalUsers, totalOwners, pendingApps, totalPaidTxns] = await Promise.all([
            User.countDocuments({ role: 'USER' }),
            User.countDocuments({ role: 'OWNER' }),
            OwnerApplication.countDocuments({ status: 'PENDING' }),
            SubscriptionTransaction.find({ status: 'PAID' }) // Lấy toàn bộ đơn PAID
        ]);

        // Tính tổng doanh thu hệ thống
        const totalRevenue = totalPaidTxns.reduce((sum, tx) => sum + tx.amount, 0);

        // 2. TỐI ƯU BIỂU ĐỒ: Xử lý nhóm theo tháng bằng Javascript (Chống lỗi Mock Data)
        const revenueMap = {};

        // Khởi tạo khung 6 tháng gần nhất (Mặc định doanh thu = 0 để biểu đồ không bị gãy)
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = `${d.getMonth() + 1}/${d.getFullYear()}`;
            revenueMap[monthStr] = 0;
        }

        // Đổ dữ liệu các đơn PAID vào khung tháng
        totalPaidTxns.forEach(tx => {
            // Bọc new Date() để ép kiểu an toàn: Xử lý mượt mà cả ISO Date lẫn String
            const date = new Date(tx.paidAt || tx.createdAt || Date.now());
            const monthStr = `${date.getMonth() + 1}/${date.getFullYear()}`;

            // Nếu tháng của đơn hàng khớp với 1 trong 6 tháng gần nhất thì cộng tiền
            if (revenueMap[monthStr] !== undefined) {
                revenueMap[monthStr] += tx.amount;
            }
        });

        // Chuyển Object thành Array cho Frontend Recharts
        const formattedRevenueData = Object.keys(revenueMap).map(month => ({
            month,
            revenue: revenueMap[month]
        }));

        // 3. Phân bổ dịch vụ (HOTEL, RESTAURANT, ACTIVITY) - GIỮ NGUYÊN CODE CŨ CỦA BẠN TRỞ XUỐNG
        const serviceDistribution = await Service.aggregate([
            {
                $group: {
                    _id: '$type',
                    value: { $sum: 1 }
                }
            }
        ]);

        const typeColors = {
            HOTEL: '#004D40',
            RESTAURANT: '#FFAB40',
            ACTIVITY: '#00C853'
        };

        const formattedServiceData = serviceDistribution.map(item => ({
            name: item._id === 'HOTEL' ? 'Khách sạn' : item._id === 'RESTAURANT' ? 'Nhà hàng' : 'Hoạt động trải nghiệm',
            value: item.value,
            color: typeColors[item._id] || '#7f8c8d'
        }));

        // 4. Nhật ký hoạt động gần đây (Ví dụ: Giao dịch đăng ký gói, hoặc hồ sơ xin duyệt mới nhất)
        const [recentTxns, recentApplications] = await Promise.all([
            SubscriptionTransaction.find().sort({ createdAt: -1 }).limit(3).populate('ownerId', 'fullName email'),
            OwnerApplication.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'fullName email')
        ]);

        const recentActivities = [];

        recentTxns.forEach(tx => {
            recentActivities.push({
                id: tx._id,
                type: 'PAYMENT',
                title: 'Giao dịch SaaS',
                desc: `Đối tác ${tx.ownerId?.fullName || tx.ownerId?.email || 'Ẩn danh'} thanh toán gói ${tx.packageCode} (${tx.amount.toLocaleString()}đ)`,
                time: new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(tx.createdAt).toLocaleDateString('vi-VN')
            });
        });

        recentApplications.forEach(app => {
            recentActivities.push({
                id: app._id,
                type: app.status === 'APPROVED' ? 'OWNER_APPROVED' : 'USER_NEW',
                title: app.status === 'APPROVED' ? 'Đã duyệt đối tác' : 'Yêu cầu duyệt đối tác',
                desc: `Doanh nghiệp ${app.businessName} đăng ký hồ sơ ${app.status === 'PENDING' ? 'đang chờ duyệt' : 'thành công'}`,
                time: new Date(app.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(app.createdAt).toLocaleDateString('vi-VN')
            });
        });

        // Sắp xếp các hoạt động theo thời gian mới nhất
        recentActivities.sort((a, b) => b.id.getTimestamp() - a.id.getTimestamp());

        const dashboardData = {
            stats: {
                totalUsers,
                totalOwners,
                pendingApps,
                totalRevenue
            },
            revenueChart: formattedRevenueData,
            serviceChart: formattedServiceData,
            recentActivities: recentActivities.slice(0, 5)
        };

        return ApiResponse.send(res, 200, 'Lấy số liệu Dashboard thành công', dashboardData);
    } catch (error) {
        next(error);
    }
};