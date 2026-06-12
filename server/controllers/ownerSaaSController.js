import SubscriptionPackage from '../models/SubscriptionPackage.js';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import payOS from '../config/payos.js';
import { sendNotification } from '../utils/notificationHelper.js';

const generateTransactionCode = () => `SAAS-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

const generateSafeOrderCode = () => {
    const timestampStr = String(Date.now()).slice(-11);
    const randomStr = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return Number(`${timestampStr}${randomStr}`);
};

export const getActivePackages = async (req, res, next) => {
    try {
        const packages = await SubscriptionPackage.find({ isActive: true }).sort({ price: 1 });
        return ApiResponse.send(res, 200, 'Lấy danh sách gói thành công', packages);
    } catch (error) {
        next(error);
    }
};

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

export const createSubscriptionPayment = async (req, res, next) => {
    try {
        const { packageId } = req.body;
        const ownerId = req.user._id;

        const saasPackage = await SubscriptionPackage.findById(packageId);
        if (!saasPackage) throw new ApiError(404, 'Gói dịch vụ không tồn tại.');

        if (saasPackage.price === 0) {
            await User.findByIdAndUpdate(ownerId, {
                currentPackage: saasPackage.packageCode,
                subscriptionStatus: 'ACTIVE',
                subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 30))
            });
            return ApiResponse.send(res, 200, 'Đã chuyển sang gói Cơ bản thành công.', { checkoutUrl: null });
        }

        const orderCode = generateSafeOrderCode();

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

        const YOUR_DOMAIN = process.env.CLIENT_URL || 'http://localhost:5173';
        const body = {
            orderCode: orderCode,
            amount: saasPackage.price,
            description: `GIA HAN SAAS DPULSE`,
            returnUrl: `${YOUR_DOMAIN}/owner/subscription/result?orderCode=${orderCode}`,
            cancelUrl: `${YOUR_DOMAIN}/owner/subscription/result?orderCode=${orderCode}`
        };

        const paymentLinkResponse = await payOS.createPaymentLink(body);

        return ApiResponse.send(res, 200, 'Tạo link thanh toán thành công', { checkoutUrl: paymentLinkResponse.checkoutUrl });
    } catch (error) {
        next(error);
    }
};

// HÀM HELPER CHUNG: XỬ LÝ MỞ KHÓA GÓI
const processSuccessfulSaaS = async (orderCode) => {
    const transaction = await SubscriptionTransaction.findOne({ payosOrderCode: orderCode, status: 'PENDING' });
    if (!transaction) return false;

    transaction.status = 'PAID';
    transaction.paidAt = new Date();
    await transaction.save();

    const user = await User.findById(transaction.ownerId);
    const isSamePackage = user.currentPackage === transaction.packageCode;
    let baseDate = new Date();

    if (isSamePackage && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()) {
        baseDate = new Date(user.subscriptionEndDate);
    }

    const newEndDate = new Date(baseDate.setDate(baseDate.getDate() + transaction.durationDays));

    await User.findByIdAndUpdate(transaction.ownerId, {
        currentPackage: transaction.packageCode,
        subscriptionStatus: 'ACTIVE',
        subscriptionEndDate: newEndDate
    });

    const newPackageConfig = await SubscriptionPackage.findOne({ packageCode: transaction.packageCode });
    if (newPackageConfig && (newPackageConfig.maxServices > 1 || newPackageConfig.maxServices === -1)) {
        const hiddenServices = await Service.find({ ownerId: transaction.ownerId, approvalStatus: 'HIDDEN' }).sort({ createdAt: 1 });

        if (hiddenServices.length > 0) {
            let currentActiveCount = await Service.countDocuments({ ownerId: transaction.ownerId, approvalStatus: 'APPROVED' });
            for (const service of hiddenServices) {
                if (newPackageConfig.maxServices === -1 || currentActiveCount < newPackageConfig.maxServices) {
                    service.approvalStatus = 'APPROVED';
                    await service.save();
                    currentActiveCount++;
                } else break;
            }
        }
    }

    await sendNotification({
        recipientId: transaction.ownerId,
        recipientRole: 'OWNER',
        title: '💎 Kích hoạt gói dịch vụ thành công!',
        content: `Cảm ơn bạn đã gia hạn gói [${transaction.packageCode}]. Hệ thống đã tự động mở khóa các dịch vụ liên quan. Hạn dùng mới: ${newEndDate.toLocaleDateString('vi-VN')}.`,
        category: 'ACCOUNT_SAAS',
        onClickUrl: '/owner/subscription'
    });

    return true;
};

export const verifySubscriptionPayment = async (req, res, next) => {
    try {
        const { orderCode } = req.body;
        const ownerId = req.user._id;

        if (!orderCode) throw new ApiError(400, 'Thiếu mã giao dịch.');

        const transaction = await SubscriptionTransaction.findOne({ payosOrderCode: orderCode, ownerId });
        if (!transaction) throw new ApiError(404, 'Không tìm thấy giao dịch trong hệ thống.');

        if (transaction.status === 'PAID') {
            return ApiResponse.send(res, 200, 'Xác thực thanh toán thành công.', { status: 'PAID' });
        }

        const paymentInfo = await payOS.getPaymentLinkInformation(Number(orderCode));

        if (paymentInfo.status === 'PAID' || paymentInfo.status === 'SUCCESS') {
            await processSuccessfulSaaS(orderCode);
            return ApiResponse.send(res, 200, 'Xác thực thanh toán thành công.', { status: 'PAID' });
        }

        return ApiResponse.send(res, 200, 'Giao dịch chưa được thanh toán.', { status: paymentInfo.status });
    } catch (error) {
        next(error);
    }
};

// WEBHOOK CHO LUỒNG SAAS
export const handlePayOSWebhook = async (req, res) => {
    try {
        const webhookData = req.body;

        const payosWebhookData = payOS.verifyPaymentWebhookData(webhookData);

        if (payosWebhookData && payosWebhookData.code === '00') {
            const orderCode = payosWebhookData.orderCode;
            await processSuccessfulSaaS(orderCode);
        }

        return res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error('Lỗi Webhook PayOS SaaS:', error.message);
        return res.json({ success: false, message: 'Webhook processing failed' });
    }
};

export const cancelSubscriptionPayment = async (req, res, next) => {
    try {
        const { orderCode } = req.body;
        const ownerId = req.user._id;

        if (!orderCode) throw new ApiError(400, 'Thiếu mã giao dịch.');

        // LỚP KHIÊN BẢO VỆ: IDOR
        const transaction = await SubscriptionTransaction.findOneAndUpdate(
            { payosOrderCode: orderCode, ownerId, status: 'PENDING' },
            { status: 'CANCELLED' },
            { new: true }
        );

        if (!transaction) {
            return ApiResponse.send(res, 200, 'Giao dịch không tồn tại hoặc bạn không có quyền hủy.');
        }

        try {
            await payOS.cancelPaymentLink(Number(orderCode));
        } catch (e) {
            console.log('Lưu ý: Link PayOS đã hết hạn hoặc bị hủy trước đó.', e.message);
        }

        return ApiResponse.send(res, 200, 'Hủy giao dịch nâng cấp gói thành công.');
    } catch (error) {
        next(error);
    }
};

export const getMySaaSStatus = async (req, res, next) => {
    try {
        const ownerId = req.user._id;
        const user = await User.findById(ownerId);

        const packageCode = user.currentPackage || 'STARTER';
        const saasPackage = await SubscriptionPackage.findOne({ packageCode });

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