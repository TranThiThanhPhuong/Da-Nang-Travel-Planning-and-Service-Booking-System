import Service from '../models/Service.js';
import User from '../models/User.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { removeVietnameseTones } from '../utils/stringUtils.js';
import { sendNotification } from '../utils/notificationHelper.js';
import axios from 'axios';

// @desc    Lấy danh sách dịch vụ (Có Lọc, Tìm kiếm, Phân trang, Sắp xếp, Ưu tiên gói VIP)
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res, next) => {
  try {
    const { keyword, type, areas, minPrice, maxPrice, hasDiscount, minRating, sort, page = 1, limit = 6 } = req.query;

    // 1. XÂY DỰNG BỘ LỌC (QUERY)
    const query = { approvalStatus: 'APPROVED' };
    if (type && type !== 'ALL') query.type = type;
    if (keyword) {
      const normalizedKeyword = removeVietnameseTones(keyword);
      query.searchString = { $regex: normalizedKeyword, $options: 'i' };
    }
    if (areas) {
      const areaArray = areas.split(',').map(area => new RegExp(area.trim(), 'i'));
      query.address = { $in: areaArray };
    }
    if (hasDiscount === 'true') query.discount = { $gt: 0 };
    if (minRating) query['ratingStats.averageRating'] = { $gte: Number(minRating) };
    if (minPrice || maxPrice) {
      query.finalPrice = {};
      if (minPrice) query.finalPrice.$gte = Number(minPrice);
      if (maxPrice) query.finalPrice.$lte = Number(maxPrice);
    }

    // 2. XÂY DỰNG SẮP XẾP (SORT)
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { finalPrice: 1 };
    if (sort === 'price_desc') sortObj = { finalPrice: -1 };
    if (sort === 'rating_desc') sortObj = { 'ratingStats.averageRating': -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // 3. AGGREGATE VỚI LOOKUP ĐỂ LẤY GÓI DỊCH VỤ TỪ BẢNG USER
    const pipeline = [
      { $match: query },
      // JOIN với bảng Users để lấy thông tin gói
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      },
      { $unwind: '$ownerInfo' },
      // Gán trọng số dựa trên gói của chủ
      {
        $addFields: {
          packageWeight: {
            $switch: {
              branches: [
                { case: { $eq: ["$ownerInfo.currentPackage", "ULTIMATE"] }, then: 3 },
                { case: { $eq: ["$ownerInfo.currentPackage", "PRO"] }, then: 2 }
              ],
              default: 1
            }
          }
        }
      },
      // Sắp xếp theo trọng số VIP trước, rồi tới sortObj người dùng chọn
      { $sort: { packageWeight: -1, ...sortObj } },
      { $skip: skip },
      { $limit: limitNum },
      { $project: { ownerInfo: 0, __v: 0 } } // Xóa thông tin ownerInfo không cần thiết trả về
    ];

    // 4. THỰC THI (SONG SONG)
    const [services, total] = await Promise.all([
      Service.aggregate(pipeline),
      Service.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return ApiResponse.send(res, 200, 'Lấy danh sách dịch vụ thành công', services, {
      count: services.length, total, page: pageNum, totalPages, hasMore: pageNum < totalPages
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private/Owner
export const createService = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      pricePerUnit,
      discount,
      address,
      coordinates,
      thumbnail,
      images,
      features,
    } = req.body;

    if (!name || !type || !description || !pricePerUnit || !address || !thumbnail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
      });
    }

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Tọa độ không hợp lệ',
      });
    }

    const service = await Service.create({
      ownerId: req.user._id,
      ownerPackage: req.ownerPackageCode,
      name,
      type,
      description,
      pricePerUnit,
      discount: discount || 0,
      location: {
        type: 'Point',
        coordinates: coordinates,
      },
      address,
      thumbnail,
      images: images || [],
      features: features || [],
      approvalStatus: 'PENDING',
    });

    const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
    const adminIds = admins.map(admin => admin._id);

    await sendNotification({
      recipientId: adminIds,
      recipientRole: 'ADMIN',
      title: '📑 Có dịch vụ mới chờ phê duyệt',
      content: `Đối tác vừa tạo dịch vụ mới: "${name}". Vui lòng kiểm tra và phê duyệt.`,
      category: 'SYSTEM_ALERT',
      onClickUrl: '/admin/services',
      metadata: { serviceId: service._id }
    });

    res.status(201).json({
      success: true,
      data: service,
      message: 'Tạo dịch vụ thành công. Đang chờ Admin duyệt.',
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all services of current owner
// @route   GET /api/services/my
// @access  Private/Owner
export const getMyServices = async (req, res) => {
  try {
    const { approvalStatus, type, search } = req.query;

    const filter = { ownerId: req.user._id };

    if (approvalStatus && approvalStatus !== 'ALL') {
      filter.approvalStatus = approvalStatus;
    }

    if (type && type !== 'ALL') {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const services = await Service.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error('Lấy dịch vụ của người dùng:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single service details
// @route   GET /api/services/:id
// @access  Public (Ai cũng xem được)
export const getServiceById = async (req, res) => {
  try {
    // Tìm dịch vụ chỉ bằng _id (Gỡ bỏ điều kiện req.user._id)
    // Populate thêm thông tin cơ bản của Owner để hiển thị trên UI nếu cần
    const service = await Service.findById(req.params.id)
      .populate('ownerId', 'fullName avatar email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
    }

    // Tùy chọn nâng cao: Bạn có thể thêm điều kiện chặn không cho xem nếu dịch vụ bị HIDDEN hoặc REJECTED
    // if (service.approvalStatus !== 'APPROVED') {
    //   return res.status(403).json({ success: false, message: 'Dịch vụ này hiện không khả dụng' });
    // }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết dịch vụ',
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Owner
export const updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
    }

    if (service.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa dịch vụ này',
      });
    }

    const updateData = { ...req.body };

    if (updateData.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: updateData.coordinates,
      };
      delete updateData.coordinates;
    }

    const finalPricePerUnit = updateData.pricePerUnit !== undefined ? Number(updateData.pricePerUnit) : service.pricePerUnit;
    const finalDiscount = updateData.discount !== undefined ? Number(updateData.discount) : service.discount;
    updateData.finalPrice = finalPricePerUnit * (1 - finalDiscount / 100);

    service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: service,
      message: 'Cập nhật dịch vụ thành công',
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete service (Soft delete - set HIDDEN)
// @route   DELETE /api/services/:id
// @access  Private/Owner
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
    }

    if (service.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa dịch vụ này',
      });
    }

    service.approvalStatus = 'HIDDEN';
    await service.save();

    res.json({
      success: true,
      message: 'Đã xóa dịch vụ',
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy danh sách các dịch vụ thuộc gói ULTIMATE để hiển thị lên Slider Trang chủ
// @route   GET /api/services/premium-banners
// @access  Public
export const getPremiumBannerServices = async (req, res, next) => {
  try {
    // 1. Tìm tất cả các dịch vụ đã duyệt
    // 2. Populate thông tin 'ownerId' để lấy trường 'currentPackage' của chủ
    const services = await Service.find({ approvalStatus: 'APPROVED' })
      .populate({
        path: 'ownerId',
        select: 'currentPackage',
        match: { currentPackage: 'ULTIMATE' } // Chỉ lấy những chủ có gói ULTIMATE
      })
      .select('name thumbnail description address finalPrice ownerId')
      .limit(20);

    // 3. Sau khi populate, những service có owner không phải ULTIMATE sẽ có ownerId = null
    // Ta dùng filter để lọc bỏ các kết quả null đó
    const premiumBanners = services.filter(service => service.ownerId !== null);

    return ApiResponse.send(res, 200, 'Lấy danh sách banner cao cấp thành công.', premiumBanners);
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách gợi ý dịch vụ từ AI Engine (Hugging Face)
// @route   GET /api/services/recommendations
// @access  Private (Chỉ user đã đăng nhập)
export const getAIRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Gọi API sang Python (Hugging Face Spaces)
    const aiResponse = await axios.get(`https://tuanloc78-dpulse-ai-service.hf.space/recommend/${userId}?limit=6`);

    // Nếu User mới tinh, chưa có data để AI phân tích
    if (!aiResponse.data.success || !aiResponse.data.data || aiResponse.data.data.length === 0) {
      return ApiResponse.send(res, 200, 'Chưa đủ dữ liệu để tạo gợi ý.', []);
    }

    // Lấy mảng ID từ Python trả về
    const recommendedIds = aiResponse.data.data.map(item => item.service_id);

    // 2. Query MongoDB để lấy thông tin chi tiết (lọc những cái đã duyệt)
    const services = await Service.find({
      _id: { $in: recommendedIds },
      approvalStatus: 'APPROVED'
    });

    // 3. QUAN TRỌNG: MongoDB $in không giữ đúng thứ tự. 
    // Phải sort lại mảng theo đúng thứ tự điểm Cosine Similarity từ AI
    const sortedServices = recommendedIds
      .map(id => services.find(s => s._id.toString() === id))
      .filter(Boolean); // Lọc bỏ nếu service đó lỡ bị xóa hoặc ẩn khỏi DB

    return ApiResponse.send(res, 200, 'Lấy danh sách gợi ý AI thành công.', sortedServices);

  } catch (error) {
    // Tình huống Fallback: Nếu AI sập, không dùng ApiError ném 500 làm sập Web.
    // In log ra terminal server và trả về mảng rỗng cho Frontend an toàn hiển thị.
    console.error("[❌ AI ENGINE ERROR] Lỗi kết nối Hugging Face:", error.message);
    return ApiResponse.send(res, 200, 'Hệ thống AI tạm thời không phản hồi.', []);
  }
};