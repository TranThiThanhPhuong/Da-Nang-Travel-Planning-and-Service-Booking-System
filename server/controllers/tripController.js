import Trip from "../models/Trip.js";
import Booking from "../models/Booking.js";
import { callAItoSchedule } from "../services/apiTripService.js";
import { filterServicesForTrip } from "../services/serviceFilterService.js";
import { generateDashboardInsights } from '../services/allnsight.js'

// @desc    Generate trip itinerary using AI
// @route   POST /api/trips/generate
// @access  Private
export const generateTrip = async (req, res) => {
  try {
    const { days, startDate, budget, travelStyle, peopleCount, title } = req.body;

    if (!days || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin ngày đi và số ngày",
      });
    }
    console.log("🔍 Filtering services for tags:", travelStyle);

    // 1. Ép kiểu dữ liệu đầu vào ngay từ đầu để đồng bộ
    const parsedDays = Number(days);
    const parsedPeopleCount = Number(peopleCount) || 1;
    const parsedBudget = budget ? Number(budget) : null;

    // 2. Gọi Service để lọc danh sách khách sạn phù hợp & còn phòng
    const { hotels, restaurants, activities } = await filterServicesForTrip({
      startDate,
      days: parsedDays,
      peopleCount: parsedPeopleCount,
      travelStyle: travelStyle || [],
      budget: parsedBudget,
    });

    // 3. Chuẩn hóa dữ liệu Nhà hàng truyền vào AI
    const aiRestaurants = restaurants.map((r) => ({
      id: r._id ? r._id.toString() : r.id, 
      name: r.name || "Nhà hàng chưa có tên",
      coords: r.location?.coordinates || [], 
      address: r.address || "",
      features: r.features || [],
      rating: r.ratingStats?.averageRating || r.rating || 0,
      price: r.finalPrice || r.pricePerUnit || 0,
    }));

    // 4. Chuẩn hóa dữ liệu Hoạt động truyền vào AI
    const aiActivities = activities.map((a) => ({
      id: a._id ? a._id.toString() : a.id,
      name: a.name || "Hoạt động trải nghiệm",
      coords: a.location?.coordinates || [],
      address: a.address || "",
      features: a.features || [],
      rating: a.ratingStats?.averageRating || a.rating || 0,
      price: a.finalPrice || a.pricePerUnit || 0,
    }));

    // 5. Gọi AI tạo lịch trình
    const itinerary = await callAItoSchedule(
      {
        days: parsedDays,
        startDate,
        peopleCount: parsedPeopleCount,
        travelStyle: travelStyle || [],
      },
      aiRestaurants,
      aiActivities,
    );

    // 6. Validation: Kiểm tra kết quả trả về từ AI
    if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI không thể thiết lập lịch trình tối ưu với các dịch vụ hiện tại. Vui lòng nới lỏng yêu cầu hoặc thử lại.",
      });
    }

    // 7. Chuẩn hóa cấu trúc để ghi vào Database
    const formattedItinerary = itinerary.map((day) => ({
      dayNumber: day.day,
      day: day.day, // 🌟 BỌC LÓT THÊM: Giúp giữ khả năng tương thích ngược cho cả day và dayNumber ở FE
      date: new Date(day.date),
      activities: day.activities.map((act) => ({
        time: act.time,
        name: act.name,
        type: act.type,
        serviceId: act.serviceId,
        address: act.address,
        price: act.price,
        discountedPrice: act.discountedPrice,
        discountPercentage: act.discountPercentage,
        thumbnail: act.thumbnail,
        ratingStats: act.ratingStats,
        description: act.description
      })),
    }));

    // 8. TỰ ĐỘNG LƯU VÀO DATABASE DƯỚI DẠNG DRAFT
    const draftTrip = await Trip.create({
      userId: req.user._id,
      title: title || `Hành trình Đà Nẵng ${parsedDays} ngày`,
      startDate: new Date(startDate),
      days: parsedDays,
      budget: parsedBudget,
      travelStyle: travelStyle || [],
      peopleCount: parsedPeopleCount,
      itinerary: formattedItinerary,
      status: "DRAFT",
    });

    // 🌟 TRẢ VỀ DATA THÊM TRƯỜNG KHÔNG LO ẢNH HƯỞNG DB
    return res.status(200).json({
      success: true,
      message: "Tạo lịch trình nháp thành công bằng AI",
      data: {
        _id: draftTrip._id,
        title: draftTrip.title,
        startDate,
        days: parsedDays,
        peopleCount: parsedPeopleCount, // Trả thêm để TripPreview hiển thị đúng số người
        status: draftTrip.status,
        itinerary: formattedItinerary, // Lấy mảng bọc lót có cả trường .day
        suggestedHotels: hotels,
        rawResources: {                  // 🌟 QUAN TRỌNG: Đính kèm dữ liệu gốc để Frontend map thông tin Preview thành công
          restaurants,
          activities
        }
      },
    });
  } catch (error) {
    console.error("❌ Error in generateTrip:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra trong quá trình tính toán lịch trình",
      error: error.message,
    });
  }
};

// @desc    Get user's trips
// @route   GET /api/trips
// @access  Private
export const getMyTrips = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }
    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("Get trips error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate({
      path: "itinerary.activities.serviceId", 
      select: "name type address thumbnail pricePerUnit finalPrice features ratingStats location description",
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }
    const tripObject = trip.toObject();
    const userBookings = await Booking.find({
      userId: trip.userId, // Khớp chủ chuyến đi
      status: { $in: ['PAID'] } // Chỉ lấy đơn hợp lệ đã thanh toán/hoàn thành
    });
    // Duyệt qua từng ngày và từng hoạt động để kiểm tra trạng thái vé
    if (tripObject.itinerary && Array.isArray(tripObject.itinerary)) {
      tripObject.itinerary.forEach((day) => {
        // Lấy ngày hiện tại của Day này (đã bóc mốc giờ để so sánh chính xác ngày)
        const currentDayDate = new Date(day.date);
        currentDayDate.setHours(0, 0, 0, 0);

        if (day.activities && Array.isArray(day.activities)) {
          // Sắp xếp thời gian như yêu cầu trước của bạn
          day.activities.sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

          // Tiến hành check xem hoạt động đã đặt chưa
          day.activities.forEach((act) => {
            const serviceIdStr = act.serviceId?._id?.toString() || act.serviceId?.toString();

            // Tìm xem có đơn đặt chỗ nào khớp dịch vụ và thời gian hay không
            const matchingBooking = userBookings.find((booking) => {
              const bookingServiceIdStr = booking.serviceId.toString();
              
              // Chuẩn hóa ngày Check-in / Check-out về dạng 0h00 để so sánh khoảng ngày
              const checkIn = new Date(booking.bookingDetails.checkInDate);
              checkIn.setHours(0, 0, 0, 0);
              const checkOut = new Date(booking.bookingDetails.checkOutDate);
              checkOut.setHours(0, 0, 0, 0);

              // Điều kiện: Trùng ID dịch vụ VÀ ngày lịch trình nằm trong khoảng [Check-in, Check-out]
              return (
                bookingServiceIdStr === serviceIdStr &&
                currentDayDate >= checkIn &&
                currentDayDate <= checkOut
              );
            });

            // Gán thêm thông tin vào object hoạt động trả về cho FE
            if (matchingBooking) {
              act.isBooked = true;
              act.bookingCode = matchingBooking.bookingCode;
              act.bookingStatus = matchingBooking.status;
            } else {
              act.isBooked = false;
              act.bookingCode = null;
            }
          });
        }
      });
    }

    res.json({
      success: true,
      data: tripObject,
    });
  } catch (error) {
    console.error("Get trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private
export const updateTrip = async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    const allowedFields = ["title", "startDate", "days", "budget", "travelStyle", "peopleCount", "status", "itinerary"];
    
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        if (key === "itinerary" && Array.isArray(req.body.itinerary)) {
          
          trip.itinerary = req.body.itinerary.map((day) => {
            // 1. Chuẩn hóa danh sách hoạt động như cũ
            const formattedActivities = day.activities.map((act) => ({
              time: act.time || "00:00", // Phòng hờ nếu không có thời gian thì đẩy lên đầu ngày
              name: act.name || act.activityName,
              type: act.type,
              serviceId: act.serviceId,
              address: act.address,
              price: act.price,
              discountedPrice: act.discountedPrice,
              discountPercentage: act.discountPercentage,
              thumbnail: act.thumbnail,
              ratingStats: act.ratingStats,
              description: act.description
            }));

            // 🌟 2. SẮP XẾP THỜI GIAN THEO THỨ TỰ TĂNG DẦN (07:00 -> 18:00)
            formattedActivities.sort((a, b) => a.time.localeCompare(b.time));

            return {
              dayNumber: day.day || day.dayNumber,
              date: day.date,
              activities: formattedActivities, // Trả về mảng đã được sắp xếp ngăn nắp
            };
          });

        } else {
          trip[key] = req.body[key];
        }
      }
    });
    
    await trip.save();

    // Để Frontend nhận lại được dữ liệu đã populate đầy đủ (giúp giao diện hiển thị mượt mà luôn)
    const updatedTrip = await Trip.findById(trip._id).populate({
      path: "itinerary.activities.serviceId",
      select: "name type address thumbnail pricePerUnit finalPrice features ratingStats location description",
    });

    res.json({
      success: true,
      data: updatedTrip, // Trả về cục data đã được sort và populate lại đầy đủ
      message: "Cập nhật lịch trình thành công",
    });
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    await trip.deleteOne();

    res.json({
      success: true,
      message: "Đã xóa lịch trình",
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Advance trip status (DRAFT -> CONFIRMED -> ONGOING -> COMPLETED)
// @route   PUT /api/trips/:id/advance-status
// @access  Private
export const advanceTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let trip = await Trip.findOne({ _id: id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình hoặc bạn không có quyền sở hữu",
      });
    }

    const currentStatus = trip.status;
    let nextStatus = "";
    let successMessage = "";

    // 🎯 THIẾT LẬP LUỒNG ĐI TUYẾN TÍNH CHÍNH XÁC, KHÔNG LO BỊ LỘN
    switch (currentStatus) {
      case "DRAFT":
        nextStatus = "CONFIRMED";
        successMessage = "Đã xác nhận và chốt lịch trình du lịch thành công!";
        break;
      case "CONFIRMED":
        nextStatus = "ONGOING";
        successMessage = "Hành trình đã bắt đầu diễn ra. Chúc bạn chuyến đi vui vẻ!";
        break;
      case "ONGOING":
        nextStatus = "COMPLETED";
        successMessage = "Chúc mừng bạn đã hoàn thành chuyến đi này!";
        break;
      case "COMPLETED":
        return res.status(400).json({
          success: false,
          message: "Chuyến đi này đã kết thúc, không thể nâng thêm trạng thái.",
        });
      default:
        return res.status(400).json({
          success: false,
          message: "Trạng thái hiện tại của chuyến đi không hợp lệ.",
        });
    }

    // Nếu người dùng tranh thủ cập nhật lại data (ví dụ như chỉnh sửa itinerary lúc từ DRAFT lên CONFIRMED)
    if (req.body.itinerary && Array.isArray(req.body.itinerary)) {
      trip.itinerary = req.body.itinerary.map((day) => ({
        dayNumber: day.day || day.dayNumber,
        date: day.date,
        activities: day.activities.map((act) => ({
          time: act.time,
          name: act.name || act.activityName,
          type: act.type,
          serviceId: act.serviceId,
          address: act.address,
          price: act.price,
          discountedPrice: act.discountedPrice,
          discountPercentage: act.discountPercentage,
          thumbnail: act.thumbnail,
          ratingStats: act.ratingStats,
          description: act.description
        })),
      }));
    }

    if (req.body.title) trip.title = req.body.title;

    trip.status = nextStatus;
    await trip.save();

    return res.status(200).json({
      success: true,
      message: successMessage,
      data: {
        tripId: trip._id,
        currentStatus: trip.status,
        trip
      }
    });
  } catch (error) {
    console.error("❌ Advance status error:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi chuyển trạng thái chuyến đi",
      error: error.message,
    });
  }
};

export const getDashboardInsights = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const user = await User.findById(ownerId);
    const packageCode = user?.currentPackage || 'STARTER';

    // 2. Nếu không phải ULTIMATE, từ chối xử lý AI lập tức
    if (packageCode !== 'ULTIMATE') {
      return res.status(403).json({
        success: false,
        message: "Tính năng Trợ lý chiến lược AI chỉ dành riêng cho phân khúc gói ULTIMATE.",
      });
    }
    
    const { bookings, services } = req.body; 

    if (!bookings || !services) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu đối soát cấu trúc kế toán để chạy AI",
      });
    }

    const aiAnalysis = await generateDashboardInsights(bookings, services);

    return res.status(200).json({
      success: true,
      data: aiAnalysis
    });
  } catch (error) {
    console.error("❌ Error in Insight Controller:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi phân tích chiến lược doanh nghiệp",
      error: error.message
    });
  }
};