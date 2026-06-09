import mongoose from 'mongoose';
import Service from '../models/Service.js';
import User from '../models/User.js';
import ServiceInventory from '../models/ServiceInventory.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { removeVietnameseTones } from '../utils/stringUtils.js';
import { sendNotification } from '../utils/notificationHelper.js';
import axios from 'axios';

// @desc    Lấy danh sách dịch vụ (Có Lọc, Tìm kiếm, Phân trang, Sắp xếp, Ưu tiên gói VIP, Lọc theo Lịch/Tồn kho)
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res, next) => {
  try {
    const {
      keyword, type, areas, minPrice, maxPrice,
      hasDiscount, minRating, sort, page = 1, limit = 6,
      startDate, endDate
    } = req.query;

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

    // 2. LOGIC LỌC THEO TỒN KHO NẾU KHÁCH CÓ CHỌN NGÀY
    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(startDate);

      // Tạo mảng danh sách các ngày khách muốn đặt
      const datesToCheck = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        datesToCheck.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Lấy toàn bộ Inventory còn chỗ trống trong những ngày đó
      const availableInventories = await ServiceInventory.find({
        date: { $in: datesToCheck },
        availableSlots: { $gt: 0 }
      }).lean();

      // Nhóm theo serviceId để đếm (VD: Cần đặt 3 ngày thì service đó phải xuất hiện 3 lần trong mảng trên)
      const serviceIdCounts = {};
      availableInventories.forEach(inv => {
        const sId = inv.serviceId.toString();
        serviceIdCounts[sId] = (serviceIdCounts[sId] || 0) + 1;
      });

      // Lọc ra các ID thỏa mãn yêu cầu
      const requiredDaysCount = datesToCheck.length;
      const validServiceIds = Object.keys(serviceIdCounts)
        .filter(sId => serviceIdCounts[sId] === requiredDaysCount)
        .map(id => new mongoose.Types.ObjectId(id)); // Ép kiểu chuẩn để dùng trong Aggregation

      // Thêm điều kiện bắt buộc vào Query chính
      query._id = { $in: validServiceIds };
    }

    // 3. XÂY DỰNG SẮP XẾP (SORT)
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { finalPrice: 1 };
    if (sort === 'price_desc') sortObj = { finalPrice: -1 };
    if (sort === 'rating_desc') sortObj = { 'ratingStats.averageRating': -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // 4. AGGREGATE VỚI LOOKUP ĐỂ LẤY GÓI DỊCH VỤ TỪ BẢNG USER
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

    // 5. THỰC THI (SONG SONG)
    const [services, total] = await Promise.all([
      Service.aggregate(pipeline),
      // Khi dùng Aggregate + Filtering ID, cần đếm trên base query để tính pagination chuẩn xác
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
    const service = await Service.findById(req.params.id)
      .populate('ownerId', 'fullName avatar email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ',
      });
    }

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
    const services = await Service.find({ approvalStatus: 'APPROVED' })
      .populate({
        path: 'ownerId',
        select: 'currentPackage',
        match: { currentPackage: 'ULTIMATE' }
      })
      .select('name thumbnail description address finalPrice ownerId')
      .limit(20);

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

    const aiResponse = await axios.get(`https://tuanloc78-dpulse-ai-service.hf.space/recommend/${userId}?limit=6`);

    if (!aiResponse.data.success || !aiResponse.data.data || aiResponse.data.data.length === 0) {
      return ApiResponse.send(res, 200, 'Chưa đủ dữ liệu để tạo gợi ý.', []);
    }

    const recommendedIds = aiResponse.data.data.map(item => item.service_id);

    const services = await Service.find({
      _id: { $in: recommendedIds },
      approvalStatus: 'APPROVED'
    });

    const sortedServices = recommendedIds
      .map(id => services.find(s => s._id.toString() === id))
      .filter(Boolean);

    return ApiResponse.send(res, 200, 'Lấy danh sách gợi ý AI thành công.', sortedServices);

  } catch (error) {
    console.error("[❌ AI ENGINE ERROR] Lỗi kết nối Hugging Face:", error.message);
    return ApiResponse.send(res, 200, 'Hệ thống AI tạm thời không phản hồi.', []);
  }
};

// @desc    Lấy toàn bộ danh sách dịch vụ cho Admin (Bao gồm mọi trạng thái)
// @route   GET /api/services/admin/all
// @access  Private/Admin
export const getAllServicesForAdmin = async (req, res, next) => {
  try {
    const services = await Service.find({})
      .populate('ownerId', 'fullName email avatar clerkId')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.send(res, 200, 'Lấy danh sách dịch vụ cho Admin thành công', services, {
      count: services.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin phê duyệt hoặc từ chối dịch vụ
// @route   PATCH /api/services/admin/:id/review
// @access  Private/Admin
export const reviewService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, "Trạng thái phê duyệt không hợp lệ");
    }

    const service = await Service.findById(id).populate('ownerId', 'fullName email clerkId');

    if (!service) {
      throw new ApiError(404, "Không tìm thấy dịch vụ");
    }

    service.approvalStatus = status;
    if (adminNotes) {
      service.adminNotes = adminNotes;
    }

    await service.save();

    if (service.ownerId) {
      const isApproved = status === 'APPROVED';
      await sendNotification({
        recipientId: service.ownerId._id,
        recipientRole: 'OWNER',
        title: isApproved ? '✅ Dịch vụ đã được duyệt!' : '❌ Dịch vụ cần chỉnh sửa',
        content: isApproved
          ? `Chúc mừng! Dịch vụ "${service.name}" của bạn đã được hiển thị công khai trên hệ thống.`
          : `Dịch vụ "${service.name}" của bạn đã bị từ chối. Lý do: ${adminNotes || 'Vui lòng kiểm tra lại hình ảnh hoặc nội dung.'}`,
        category: 'SYSTEM_ALERT',
        onClickUrl: '/owner/services'
      });
    }

    return ApiResponse.send(
      res,
      200,
      `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} dịch vụ thành công`,
      service
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Kiểm tra số lượng chỗ trống (tồn kho) khả dụng của 1 dịch vụ theo khoảng ngày
// @route   GET /api/services/:id/inventory
// @access  Public
export const checkServiceInventory = async (req, res, next) => {
  try {
    const { id } = req.params; // serviceId
    const { checkInDate, checkOutDate } = req.query;

    if (!checkInDate) {
      return ApiResponse.send(res, 200, 'Chưa có ngày bắt đầu', { availableSlots: null });
    }

    const start = new Date(checkInDate);
    // Nếu không có ngày kết thúc (nhà hàng, hoạt động), chỉ check 1 ngày
    const end = checkOutDate ? new Date(checkOutDate) : new Date(checkInDate);

    const datesToCheck = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      datesToCheck.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const inventories = await ServiceInventory.find({
      serviceId: id,
      date: { $in: datesToCheck }
    }).lean();

    // Nếu DB không trả về đủ số ngày khách yêu cầu -> Owner chưa thiết lập kho cho ngày đó (chưa mở bán)
    if (inventories.length !== datesToCheck.length) {
      return ApiResponse.send(res, 200, 'Lịch chưa mở bán', { availableSlots: 0 });
    }

    // TÌM "ĐIỂM NGHẼN" (BOTTLENECK)
    // VD: Khách đặt 3 ngày. Ngày 1 còn 5 phòng, Ngày 2 còn 2 phòng, Ngày 3 còn 4 phòng.
    // => Khách chỉ có thể đặt tối đa 2 phòng cho toàn bộ chuyến đi.
    const minAvailable = Math.min(...inventories.map(inv => inv.availableSlots));

    return ApiResponse.send(res, 200, 'Lấy tồn kho thành công', { availableSlots: minAvailable });

  } catch (error) {
    next(error);
  }
};