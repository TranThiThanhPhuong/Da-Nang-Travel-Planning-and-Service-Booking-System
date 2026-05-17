import Service from "../models/Service.js";

export const filterServicesForTrip = async ({
  startDate,
  days,
  peopleCount,
  travelStyle = [],
  budget,
}) => {
  // Tạo mảng dateRange chứa các ngày thực tế của chuyến đi dưới dạng Date Object
  const [year, month, day] = startDate.split("-").map(Number);
  const dateRange = [];
  for (let i = 0; i < days; i++) {
    dateRange.push(new Date(Date.UTC(year, month - 1, day + i, 0, 0, 0)));
  }

  // --- TÍNH TOÁN NGÂN SÁCH TRẦN (Budget Ceiling) THEO ĐÚNG CÔNG THỨC CỦA BẠN ---
  let hotelBudgetLimit = Infinity;
  let restaurantBudgetLimit = Infinity;
  let activityBudgetLimit = Infinity;

  if (budget && Number(budget) > 0) {
    const totalBudget = Number(budget);
    
    // 🏨 Khách sạn: Toàn bộ thời gian lưu trú < Budget / 4
    hotelBudgetLimit = totalBudget / 4; 
    
    // 🍽️ Nhà hàng: Ăn uống chiếm 40% tổng ngân sách. 
    // Giả định trung bình 3 bữa/ngày => Trần cho 1 bữa ăn = (Total * 40%) / (Số ngày * 3 bữa)
    restaurantBudgetLimit = (totalBudget * 0.40) / (days * 3);
    
    // 🎡 Hoạt động: Vui chơi chiếm 25% tổng ngân sách.
    // Giả định trung bình 2 hoạt động/ngày => Trần cho 1 hoạt động = (Total * 25%) / (Số ngày * 2 hoạt động)
    activityBudgetLimit = (totalBudget * 0.25) / (days * 2);
  }

  // =========================================================================
  // 🏨 PIPELINE: LỌC KHÁCH SẠN (Giới hạn tối đa 6 khách sạn tốt nhất)
  // =========================================================================
  const hotelPipeline = [
    // Trường hợp 1: Lọc thô hệ thống và ngân sách lưu trú cho toàn bộ thời gian
    { 
      $match: { 
        type: "HOTEL",
        approvalStatus: "APPROVED",
        finalPrice: { $lte: hotelBudgetLimit }
      } 
    },
    // Trường hợp 2: Lọc thời gian và đồng bộ kho hàng ($lookup)
    {
      $lookup: {
        from: "serviceinventories",
        let: { hotelId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$serviceId", "$$hotelId"] },
                  { $in: ["$date", dateRange] },
                  { $gte: ["$availableSlots", 1] } // Trường hợp 3: Khách sạn chỉ cần >= 1 phòng trống
                ]
              }
            }
          }
        ],
        as: "validInventories"
      }
    },
    // Chuẩn bị dữ liệu đếm ngày và thu thập mảng ngày còn trống cho AI
    {
      $addFields: {
        validDaysCount: { $size: "$validInventories" },
        totalAvailableSlots: { $sum: "$validInventories.availableSlots" },
        availableDates: "$validInventories.date"
      }
    },
    // Trường hợp 4: Khách sạn phải còn trống phòng XUYÊN SUỐT chuyến đi
    { $match: { validDaysCount: days } },
    // Trường hợp 5: Sắp xếp thứ tự ưu tiên bằng thuật toán chấm điểm
    {
      $addFields: {
        matchScore: {
          $add: [
            // Trùng khớp sở thích: nếu giao thoa > 0 cộng 1000 điểm, không trùng cộng 0 (Không bị loại)
            {
              $cond: {
                if: { $gt: [{ $size: { $setIntersection: ["$features", travelStyle] } }, 0] },
                then: 1000,
                else: 0
              }
            },
            // Điểm chất lượng: số sao * 10
            { $multiply: [{ $ifNull: ["$ratingStats.averageRating", 0] }, 10] },
            // Điểm số lượng chỗ trống còn lại * 0.1
            { $multiply: ["$totalAvailableSlots", 0.1] }
          ]
        }
      }
    },
    { $sort: { matchScore: -1 } },
    { $limit: 6 }, // ĐÚNG YÊU CẦU: Chỉ lấy tối đa 6 khách sạn để tránh AI bị ngộp
    { $project: { validInventories: 0, validDaysCount: 0 } }
  ];

  // =========================================================================
  // 🍽️ PIPELINE: LỌC NHÀ HÀNG (Không giới hạn $limit để có nhiều dịch vụ ăn uống)
  // =========================================================================
  const restaurantPipeline = [
    // Trường hợp 1: Lọc thô hệ thống và ngân sách trần cho 1 bữa ăn
    { 
      $match: { 
        type: "RESTAURANT",
        approvalStatus: "APPROVED",
        finalPrice: { $lte: restaurantBudgetLimit }
      } 
    },
    // Trường hợp 2 & 3: Đồng bộ kho hàng và kiểm tra slot phải chứa đủ số người trong đoàn (peopleCount)
    {
      $lookup: {
        from: "serviceinventories",
        let: { restaurantId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$serviceId", "$$restaurantId"] },
                  { $in: ["$date", dateRange] },
                  { $gte: ["$availableSlots", peopleCount] }
                ]
              }
            }
          }
        ],
        as: "validInventories"
      }
    },
    {
      $addFields: {
        validDaysCount: { $size: "$validInventories" },
        totalAvailableSlots: { $sum: "$validInventories.availableSlots" },
        availableDates: "$validInventories.date"
      }
    },
    // Trường hợp 4: Chỉ cần còn đủ chỗ phục vụ trong ít nhất 1 ngày bất kỳ (>= 1) là giữ lại
    { $match: { validDaysCount: { $gte: 1 } } },
    // Trường hợp 5: Tính điểm ưu tiên theo sở thích, đánh giá sao, lượng chỗ còn trống
    {
      $addFields: {
        matchScore: {
          $add: [
            {
              $cond: {
                if: { $gt: [{ $size: { $setIntersection: ["$features", travelStyle] } }, 0] },
                then: 1000,
                else: 0
              }
            },
            { $multiply: [{ $ifNull: ["$ratingStats.averageRating", 0] }, 10] },
            { $multiply: ["$totalAvailableSlots", 0.1] }
          ]
        }
      }
    },
    { $sort: { matchScore: -1 } }, // Sắp xếp chỗ tốt lên đầu nhưng GIỮ LẠI toàn bộ danh sách hợp lệ
    { $project: { validInventories: 0, validDaysCount: 0 } }
  ];

  // =========================================================================
  // 🎡 PIPELINE: LỌC HOẠT ĐỘNG (Giữ lượng lớn data cho nhiều ngày vui chơi)
  // =========================================================================
  const activityPipeline = [
    // Trường hợp 1: Lọc thô hệ thống và ngân sách trần cho 1 hoạt động vui chơi
    { 
      $match: { 
        type: "ACTIVITY",
        approvalStatus: "APPROVED",
        finalPrice: { $lte: activityBudgetLimit }
      } 
    },
    // Trường hợp 2 & 3: Trích xuất kho hàng trùng lịch đi và còn trống >= peopleCount slots
    {
      $lookup: {
        from: "serviceinventories",
        let: { activityId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$serviceId", "$$activityId"] },
                  { $in: ["$date", dateRange] },
                  { $gte: ["$availableSlots", peopleCount] }
                ]
              }
            }
          }
        ],
        as: "validInventories"
      }
    },
    {
      $addFields: {
        validDaysCount: { $size: "$validInventories" },
        totalAvailableSlots: { $sum: "$validInventories.availableSlots" },
        availableDates: "$validInventories.date"
      }
    },
    // Trường hợp 4: Chỉ cần khả dụng ít nhất 1 ngày bất kỳ của chuyến đi (>= 1)
    { $match: { validDaysCount: { $gte: 1 } } },
    // Trường hợp 5: Chấm điểm ưu tiên (Ưu tiên sở thích lên trước, nhưng không loại bỏ dịch vụ khác)
    {
      $addFields: {
        matchScore: {
          $add: [
            {
              $cond: {
                if: { $gt: [{ $size: { $setIntersection: ["$features", travelStyle] } }, 0] },
                then: 1000,
                else: 0
              }
            },
            { $multiply: [{ $ifNull: ["$ratingStats.averageRating", 0] }, 10] },
            { $multiply: ["$totalAvailableSlots", 0.1] }
          ]
        }
      }
    },
    { $sort: { matchScore: -1 } },
    { $project: { validInventories: 0, validDaysCount: 0 } }
  ];

  // Kích hoạt thực thi đồng thời cả 3 luồng để đạt tốc độ xử lý nhanh nhất
  const [availableHotels, availableRestaurants, availableActivities] = await Promise.all([
    Service.aggregate(hotelPipeline),
    Service.aggregate(restaurantPipeline),
    Service.aggregate(activityPipeline)
  ]);

  return {
    hotels: availableHotels,
    restaurants: availableRestaurants,
    activities: availableActivities,
  };
};