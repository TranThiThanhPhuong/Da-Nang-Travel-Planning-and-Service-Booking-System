import mongoose from 'mongoose';
import SubscriptionTransaction from '../models/SubscriptionTransaction.js';
import User from '../models/User.js';
import SubscriptionPackage from '../models/SubscriptionPackage.js';
import { sendNotification } from '../utils/notificationHelper.js';
import { downgradeOwnerToStarter } from '../services/subscriptionService.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

// 1. Lấy danh sách giao dịch có bộ lọc và phân trang
export const getTransactions = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 5, search } = req.query;

        const query = {};
        if (status && status !== 'ALL') {
            query.status = status;
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        if (search) {
            query.$or = [
                { transactionCode: { $regex: search, $options: 'i' } },
                { packageCode: { $regex: search, $options: 'i' } }
            ];
        }

        const [transactions, total] = await Promise.all([
            SubscriptionTransaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('ownerId', 'fullName email'),
            SubscriptionTransaction.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum);

        return ApiResponse.send(res, 200, 'Lấy danh sách giao dịch thành công', transactions, {
            totalItems: total,
            page: pageNum,
            totalPages,
            pageSize: limitNum
        });
    } catch (error) {
        next(error);
    }
};

// 2. Xác nhận thanh toán thủ công (Mark PENDING -> PAID)
export const confirmPaymentManual = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const transaction = await SubscriptionTransaction.findById(id).session(session);
        if (!transaction) {
            throw new ApiError(404, 'Không tìm thấy thông tin giao dịch này.');
        }

        if (transaction.status !== 'PENDING') {
            throw new ApiError(400, 'Chỉ phê duyệt thủ công giao dịch đang ở trạng thái PENDING.');
        }

        transaction.status = 'PAID';
        transaction.paidAt = new Date();
        await transaction.save({ session });

        const owner = await User.findById(transaction.ownerId).session(session);
        if (owner) {
            const pkg = await SubscriptionPackage.findById(transaction.packageId).session(session);

            owner.currentPackage = transaction.packageCode;
            owner.subscriptionStatus = 'ACTIVE';

            const daysToAdd = transaction.durationDays || pkg?.durationDays || 30;
            const currentExpiry = owner.subscriptionEndDate && owner.subscriptionEndDate > new Date()
                ? new Date(owner.subscriptionEndDate)
                : new Date();

            currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);
            owner.subscriptionEndDate = currentExpiry;

            await owner.save({ session });

            // Gửi thông báo real-time qua Socket
            await sendNotification({
                recipientId: owner._id,
                recipientRole: 'OWNER',
                title: 'Hóa đơn đã được thanh toán thành công (Thủ công)',
                content: `Hóa đơn mua gói ${transaction.packageCode} đã được ban quản trị xác nhận thủ công thành công. Thời gian sử dụng thêm ${daysToAdd} ngày.`,
                category: 'FINANCIAL',
                onClickUrl: '/owner/subscription',
                metadata: { transactionId: transaction._id }
            }, session);
        }

        await session.commitTransaction();
        session.endSession();

        return ApiResponse.send(res, 200, 'Xác nhận thanh toán thủ công thành công', transaction);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// 3. Hoàn trả tiền thủ công và tự động hạ cấp gói dịch vụ (PAID -> CANCELLED)
export const refundManual = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { reason } = req.body;

        const transaction = await SubscriptionTransaction.findById(id).session(session);
        if (!transaction) {
            throw new ApiError(404, 'Không tìm thấy thông tin giao dịch.');
        }

        if (transaction.status !== 'PAID') {
            throw new ApiError(400, 'Chỉ thực hiện hoàn trả tiền cho giao dịch đã thanh toán thành công (PAID).');
        }

        // 1. Cập nhật trạng thái giao dịch sang hủy bỏ hoàn tiền
        transaction.status = 'CANCELLED';
        await transaction.save({ session });

        // 2. Gọi hàm dùng chung để tự động hạ cấp đối tác về gói STARTER và thu hồi dịch vụ thừa
        await downgradeOwnerToStarter(transaction.ownerId, session);

        // 3. Gửi thêm thông báo chi tiết về tài chính & lý do hoàn trả
        await sendNotification({
            recipientId: transaction.ownerId,
            recipientRole: 'OWNER',
            title: '💸 Đã hoàn tất thủ tục hoàn trả tiền',
            content: `Hóa đơn ${transaction.transactionCode} đã được ban quản lý hoàn trả thành công. Lý do: ${reason || 'Theo yêu cầu đối tác'}.`,
            category: 'FINANCIAL',
            onClickUrl: '/owner/subscription',
            metadata: { transactionId: transaction._id }
        }, session);

        await session.commitTransaction();
        session.endSession();

        return ApiResponse.send(res, 200, 'Đã hoàn tiền và hạ cấp gói của đối tác thành công.', transaction);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};