import Service from '../models/Service.js';
import User from '../models/User.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { removeVietnameseTones } from '../utils/stringUtils.js';

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

    // Prevent editing if APPROVED (optional - tùy business logic)
    // if (service.approvalStatus === 'APPROVED') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Không thể sửa dịch vụ đã được duyệt',
    //   });
    // }

    if (req.body.coordinates) {
      req.body.location = {
        type: 'Point',
        coordinates: req.body.coordinates,
      };
      delete req.body.coordinates;
    }

    service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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