import SubscriptionPackage from '../models/SubscriptionPackage.js';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import payOS from '../config/payos.js';
import { sendNotification } from '../utils/notificationHelper.js';

const generateTransactionCode = () => `SAAS-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

// 1. Lấy danh sách các gói đang mở bán
export const getActivePackages = async (req, res, next) => {
    try {
        const packages = await SubscriptionPackage.find({ isActive: true }).sort({ price: 1 });
        return ApiResponse.send(res, 200, 'Lấy danh sách gói thành công', packages);
    } catch (error) {
        next(error);
    }
};

// 2. Lấy lịch sử giao dịch của Owner (Dành cho trang Invoices.jsx)
export const getMyTransactions = async (req, res, next) => {
    try {
        const ownerId = req.user._id;
        const transactions = await SubscriptionTransaction.find({ ownerId })
            .populate('packageId', 'name')
            .sort({ createdAt: -1 });
        return ApiResponse.send(res, 200, 'Lấy lịch sử giao dịch thành công', transactions);
    } catch (error) {
        next(error);
    }
};

// 3. Tạo link thanh toán PayOS để nâng cấp gói
export const createSubscriptionPayment = async (req, res, next) => {
    try {
        const { packageId } = req.body;
        const ownerId = req.user._id;

        const saasPackage = await SubscriptionPackage.findById(packageId);
        if (!saasPackage) throw new ApiError(404, 'Gói dịch vụ không tồn tại.');

        // NẾU LÀ GÓI MIỄN PHÍ (STARTER) -> Nâng cấp trực tiếp không cần qua PayOS
        if (saasPackage.price === 0) {
            await User.findByIdAndUpdate(ownerId, {
                currentPackage: saasPackage.packageCode,
                subscriptionStatus: 'ACTIVE',
                // STARTER có thể không có ngày hết hạn hoặc set 30 năm
                subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 30))
            });
            return ApiResponse.send(res, 200, 'Đã chuyển sang gói Cơ bản thành công.', { checkoutUrl: null });
        }

        // TẠO GIAO DỊCH CHỜ THANH TOÁN
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

        const transaction = await SubscriptionTransaction.create({
            transactionCode: generateTransactionCode(),
            ownerId,
            packageId: saasPackage._id,
            packageCode: saasPackage.packageCode,
            amount: saasPackage.price,
            durationDays: saasPackage.durationDays,
            payosOrderCode: orderCode,
            status: 'PENDING'
        });

        // TẠO LINK PAYOS
        const YOUR_DOMAIN = process.env.CLIENT_URL || 'http://localhost:5173';
        const body = {
            orderCode: orderCode,
            amount: saasPackage.price,
            description: `Mua goi ${saasPackage.packageCode}`,
            returnUrl: `${YOUR_DOMAIN}/owner/subscription/result?orderCode=${orderCode}`,
            cancelUrl: `${YOUR_DOMAIN}/owner/subscription/result?orderCode=${orderCode}`
        };

        const paymentLinkResponse = await payOS.paymentRequests.create(body);

        return ApiResponse.send(res, 200, 'Tạo link thanh toán thành công', { checkoutUrl: paymentLinkResponse.checkoutUrl });
    } catch (error) {
        next(error);
    }
};

// 4. Xác thực thanh toán nâng cấp gói
export const verifySubscriptionPayment = async (req, res, next) => {
    try {
        const { orderCode } = req.body;
        const ownerId = req.user._id;

        if (!orderCode) throw new ApiError(400, 'Thiếu mã giao dịch.');

        const paymentInfo = await payOS.paymentRequests.get(String(orderCode));
        const transaction = await SubscriptionTransaction.findOne({ payosOrderCode: orderCode, ownerId });

        if (!transaction) throw new ApiError(404, 'Không tìm thấy giao dịch trong hệ thống.');

        if (paymentInfo.status === 'PAID' || paymentInfo.status === 'SUCCESS') {

            // CHỈ XỬ LÝ NẾU ĐƠN HÀNG CHƯA ĐƯỢC ĐÁNH DẤU LÀ PAID
            if (transaction.status !== 'PAID') {

                // 1. Cập nhật giao dịch
                transaction.status = 'PAID';
                transaction.paidAt = new Date();
                await transaction.save();

                // 2. LOGIC TÍNH NGÀY HẾT HẠN
                // Kiểm tra xem User đang mua lại gói cũ hay nâng cấp sang gói mới
                const isSamePackage = req.user.currentPackage === transaction.packageCode;
                let baseDate = new Date(); // Mặc định luôn tính từ ngày hôm nay

                // CHỈ CỘNG DỒN KHI: Mua lại ĐÚNG gói đang xài VÀ gói đó chưa hết hạn
                if (isSamePackage && req.user.subscriptionEndDate && new Date(req.user.subscriptionEndDate) > new Date()) {
                    baseDate = new Date(req.user.subscriptionEndDate);
                }

                // Tính ngày hết hạn mới
                const newEndDate = new Date(baseDate.setDate(baseDate.getDate() + transaction.durationDays));

                // 3. Cập nhật User
                await User.findByIdAndUpdate(ownerId, {
                    currentPackage: transaction.packageCode,
                    subscriptionStatus: 'ACTIVE',
                    subscriptionEndDate: newEndDate
                });

                // 4. TỰ ĐỘNG MỞ KHÓA DỊCH VỤ
                const newPackageConfig = await SubscriptionPackage.findOne({ packageCode: transaction.packageCode });
                if (newPackageConfig && (newPackageConfig.maxServices > 1 || newPackageConfig.maxServices === -1)) {
                    const hiddenServices = await Service.find({ ownerId, approvalStatus: 'HIDDEN' }).sort({ createdAt: 1 });

                    if (hiddenServices.length > 0) {
                        let currentActiveCount = await Service.countDocuments({ ownerId, approvalStatus: 'APPROVED' });
                        for (const service of hiddenServices) {
                            if (newPackageConfig.maxServices === -1 || currentActiveCount < newPackageConfig.maxServices) {
                                service.approvalStatus = 'APPROVED';
                                await service.save();
                                currentActiveCount++;
                            } else {
                                break;
                            }
                        }
                    }
                }
                await sendNotification({
                    recipientId: ownerId,
                    recipientRole: 'OWNER',
                    title: '💎 Kích hoạt gói dịch vụ thành công!',
                    content: `Cảm ơn bạn đã gia hạn gói [${transaction.packageCode}]. Hệ thống đã tự động mở khóa các dịch vụ liên quan. Hạn dùng mới: ${newEndDate.toLocaleDateString('vi-VN')}.`,
                    category: 'ACCOUNT_SAAS',
                    onClickUrl: '/owner/subscription'
                });
            }
            // Trả về kết quả Thành công
            return ApiResponse.send(res, 200, 'Xác thực thanh toán thành công.', { status: 'PAID' });
        }

        return ApiResponse.send(res, 200, 'Giao dịch chưa được thanh toán.', { status: paymentInfo.status });
    } catch (error) {
        next(error);
    }
};

// 5. Hủy giao dịch khi Owner đổi ý
export const cancelSubscriptionPayment = async (req, res, next) => {
    try {
        const { orderCode } = req.body;
        const ownerId = req.user._id;

        if (!orderCode) throw new ApiError(400, 'Thiếu mã giao dịch.');

        // Gửi yêu cầu hủy link sang hệ thống PayOS
        try {
            await payOS.paymentRequests.cancel(String(orderCode));
        } catch (e) {
            console.log('Lưu ý: Link PayOS đã hết hạn hoặc bị hủy trước đó.', e.message);
        }

        // Cập nhật trạng thái giao dịch trong DB thành CANCELLED
        const transaction = await SubscriptionTransaction.findOneAndUpdate(
            { payosOrderCode: orderCode, ownerId, status: 'PENDING' },
            { status: 'CANCELLED' },
            { new: true }
        );

        if (!transaction) {
            return ApiResponse.send(res, 200, 'Giao dịch không tồn tại hoặc đã được xử lý trước đó.');
        }

        return ApiResponse.send(res, 200, 'Hủy giao dịch nâng cấp gói thành công.');
    } catch (error) {
        next(error);
    }
};

// 6. Lấy trạng thái gói dịch vụ hiện tại của Owner
export const getMySaaSStatus = async (req, res, next) => {
    try {
        const ownerId = req.user._id;
        const user = await User.findById(ownerId);

        const packageCode = user.currentPackage || 'STARTER';
        const saasPackage = await SubscriptionPackage.findOne({ packageCode });

        // Đếm số dịch vụ chủ cơ sở đang có
        const currentServiceCount = await Service.countDocuments({ ownerId });

        return ApiResponse.send(res, 200, 'Lấy trạng thái gói thành công.', {
            currentPackage: packageCode,
            subscriptionEndDate: user.subscriptionEndDate,
            maxServices: saasPackage ? saasPackage.maxServices : 1,
            currentServiceCount: currentServiceCount
        });
    } catch (error) {
        next(error);
    }
};