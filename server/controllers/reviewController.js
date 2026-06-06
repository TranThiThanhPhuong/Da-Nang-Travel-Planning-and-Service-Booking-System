import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";
import { sendNotification } from '../utils/notificationHelper.js';

// @desc    Tạo đánh giá mới cho dịch vụ
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookingId, rating, comment, isAnonymous, images } = req.body;

    // 1. Kiểm tra booking có tồn tại và thuộc về user không
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res
        .status(442)
        .json({
          success: false,
          message:
            "Đơn đặt chỗ không tồn tại hoặc không thuộc quyền sở hữu của bạn.",
        });
    }

    // 🔥 CHỐT CHẶN 1: Chỉ đánh giá khi đã hoàn thành (Verified Purchase)
    if (booking.status !== "COMPLETED") {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Bạn chỉ có thể đánh giá dịch vụ sau khi chuyến đi/sử dụng dịch vụ đã hoàn thành.",
        });
    }

    // 🔥 CHỐT CHẶN 2: Giới hạn thời gian (Cho phép đánh giá trong vòng 14 ngày sau checkOutDate)
    // Lấy ngày mốc để tính: Ưu tiên checkOutDate (Khách sạn), nếu không có thì fallback về checkInDate
    const targetDate = booking.bookingDetails.checkOutDate
      ? new Date(booking.bookingDetails.checkOutDate)
      : new Date(booking.bookingDetails.checkInDate);

    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - targetDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 14) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Đã quá thời hạn 14 ngày cho phép đánh giá dịch vụ này.",
        });
    }

    // 🔥 CHỐT CHẶN 3: 1 Booking chỉ được đánh giá duy nhất 1 lần
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Bạn đã đánh giá dịch vụ này cho đơn đặt chỗ hiện tại rồi.",
        });
    }

    // 2. Tiến hành tạo review
    const newReview = await Review.create({
      userId,
      serviceId: booking.serviceId, // Lấy trực tiếp từ dữ liệu booking gốc nhằm bảo mật
      bookingId,
      rating,
      comment,
      isAnonymous: isAnonymous || false,
      images: images || [],
    });

    const reviewerName = isAnonymous ? "Một khách hàng ẩn danh" : (req.user.fullName || "Khách hàng");
    
    await sendNotification({
      recipientId: booking.ownerId, // Gửi tới chủ dịch vụ
      recipientRole: 'OWNER',
      title: `⭐ Đánh giá mới từ ${reviewerName}`,
      content: `Đơn hàng #${booking.bookingCode} vừa nhận được đánh giá ${rating} sao: "${comment.substring(0, 40)}${comment.length > 40 ? '...' : ''}"`,
      category: 'BOOKING_STATUS',
      onClickUrl: `/services/${booking.serviceId}`,
      metadata: { reviewId: newReview._id, serviceId: booking.serviceId }
    });

    return res.status(201).json({
      success: true,
      message: "Cảm ơn bạn đã gửi đánh giá thực tế!",
      data: newReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách đánh giá của 1 dịch vụ (Bộ lọc & Sắp xếp nâng cao)
// @route   GET /api/reviews/service/:serviceId
// @access  Public
export const getServiceReviews = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { sort, rating, hasImages, page = 1, limit = 10 } = req.query;

    // Xây dựng bộ lọc (Query Filter)
    const filter = { serviceId: new mongoose.Types.ObjectId(serviceId) };

    // Lọc theo số sao cụ thể (Ví dụ: 1, 2, 3, 4, 5)
    if (rating) {
      filter.rating = Number(rating);
    }

    // Lọc các bình luận có kèm hình ảnh thực tế
    if (hasImages === "true") {
      filter.images = { $exists: true, $not: { $size: 0 } };
    }

    // Xây dựng bộ tiêu chí Sắp xếp (Sorting)
    let sortCriteria = { createdAt: -1 }; // Mặc định: Mới nhất
    if (sort === "oldest") sortCriteria = { createdAt: 1 };
    if (sort === "highestRating") sortCriteria = { rating: -1, createdAt: -1 };
    if (sort === "lowestRating") sortCriteria = { rating: 1, createdAt: -1 };

    // Thực hiện phân trang (Pagination) và Populate thông tin người dùng
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find(filter)
      .populate({
        path: "userId",
        select: "fullName avatar", // Chỉ lấy các trường an toàn hiển thị ra ngoài
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const formattedReviews = reviews.map((review) => {
      if (review.isAnonymous) {
        // Người dùng chọn ẩn danh: Che toàn bộ thông tin gốc từ Server
        review.userId = {
          fullName: "Người dùng ẩn danh",
          avatar: null, // Trả về null để FE render icon bảo mật chuyên biệt
        };
      } else if (!review.userId) {
        // Trường hợp khẩn cấp nếu ID trong DB bị lỗi/lệch không tìm thấy bản ghi User tương ứng
        review.userId = {
          fullName: "Thành viên D-Pulse",
          avatar: "", // Để trống chuỗi để FE sử dụng avatar ký tự hoặc icon mặc định ổn định hơn
        };
      }
      return review;
    });

    const totalReviews = await Review.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: formattedReviews,
      pagination: {
        totalReviews,
        currentPage: Number(page),
        totalPages: Math.ceil(totalReviews / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thống kê nhanh tỷ lệ phần trăm các mức sao (Rating Summary Progress Bar)
// @route   GET /api/reviews/service/:serviceId/summary
// @access  Public
export const getReviewSummary = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    // Sử dụng Aggregate để đếm số lượng phân bổ của từng mức sao (1 -> 5) trong 1 lượt quét duy nhất
    const stats = await Review.aggregate([
      { $match: { serviceId: new mongoose.Types.ObjectId(serviceId) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    // Khởi tạo khung phân phối mặc định
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalReviews = 0;

    stats.forEach((item) => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
        totalReviews += item.count;
      }
    });

    // Tính toán tỷ lệ phần trăm tương ứng cho từng mức sao phục vụ Progress Bar ở FE
    const percentageDistribution = {};
    for (let star = 5; star >= 1; star--) {
      percentageDistribution[star] = {
        count: distribution[star],
        percentage:
          totalReviews > 0
            ? Math.round((distribution[star] / totalReviews) * 100)
            : 0,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        totalReviews,
        distribution: percentageDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};