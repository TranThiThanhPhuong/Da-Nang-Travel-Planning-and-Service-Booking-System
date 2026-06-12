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

  // TÍNH TOÁN SỐ ĐÊM LƯU TRÚ THỰC TẾ CỦA KHÁCH SẠN (Nights)
  const nights = Math.max(1, days - 1); 
  
  // MẢNG NGÀY CHO KHÁCH SẠN: Chỉ lấy đến ngày hôm trước của ngày check-out
  const hotelDateRange = [];
  for (let i = 0; i < nights; i++) {
    hotelDateRange.push(new Date(Date.UTC(year, month - 1, day + i, 0, 0, 0)));
  }

  const segmentTags = ["LUXURY", "MID_RANGE", "BUDGET", "HOMESTAY"];
  // Trích xuất riêng tag phân khúc của khách sạn
  const userSegments = travelStyle.filter(tag => segmentTags.includes(tag));

  let hotelBudgetLimit = Infinity;
  let restaurantBudgetLimit = Infinity;
  let activityBudgetLimit = Infinity;

  if (budget && Number(budget) > 0) {
    const totalBudget = Number(budget);
    const nights = Math.max(1, days - 1); // Tính theo số đêm thực tế lưu trú
    
    hotelBudgetLimit = (totalBudget / 4) / nights; 
    restaurantBudgetLimit = (totalBudget * 0.40) / (days * 3);
    activityBudgetLimit = (totalBudget * 0.25) / (days * 2);
  }

  // =========================================================================
  // 🏨 PIPELINE: LỌC KHÁCH SẠN (Giới hạn tối đa 6 khách sạn tốt nhất)
  // =========================================================================
  const hotelPipeline = [
    { 
      $match: { 
        type: "HOTEL",
        approvalStatus: "APPROVED",
        ...(budget ? { finalPrice: { $lte: hotelBudgetLimit } } : {})
      } 
    },
    {
      $lookup: {
        from: "serviceinventories", // Khớp đúng tên collection trong DB
        let: { hotelId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$serviceId", "$$hotelId"] },
                  { $in: ["$date", hotelDateRange] }, // 🌟 ĐỔI MỚI: Chỉ check phòng các đêm cần ở
                  { $gte: ["$availableSlots", 1] }
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
    {
      $addFields: {
        matchScore: {
          $add: [
            // 🌟 ĐỔI MỚI: Còn phòng SUỐT CHUYẾN ĐÊM (+5000đ) -> So sánh với số đêm (nights)
            { $cond: { if: { $eq: ["$validDaysCount", nights] }, then: 5000, else: 0 } },
            // ƯU TIÊN 2: Còn phòng ít nhất 1 đêm bất kỳ (+2000đ)
            { $cond: { if: { $gte: ["$validDaysCount", 1] }, then: 2000, else: 0 } },
            // ƯU TIÊN 3: Trùng khớp phân khúc Luxury/Budget (+1000đ)
            {
              $cond: {
                if: { $gt: [{ $size: { $setIntersection: ["$features", userSegments] } }, 0] },
                then: 1000,
                else: 0
              }
            },
            // ƯU TIÊN 4: Trùng khớp tiện ích phụ (+200đ)
            {
              $cond: {
                if: { $gt: [{ $size: { $setIntersection: ["$features", travelStyle] } }, 0] },
                then: 200,
                else: 0
              }
            },
            // MẶC ĐỊNH: Đánh giá sao làm cán cân cuối cùng
            { $multiply: [{ $ifNull: ["$ratingStats.averageRating", 0] }, 10] }
          ]
        }
      }
    },
    { $sort: { matchScore: -1 } },
    { $limit: 6 }, 
    { $project: { validInventories: 0 } } // Giữ lại validDaysCount để format dữ liệu bên dưới
  ];

  const parsedDays = Number(days);

  const breakfastLimit = Math.max(3, Math.ceil(parsedDays * 1.5)); // Đi 3 ngày cần ~5 quán sáng
  const mainMealLimit = Math.max(6, Math.ceil(parsedDays * 2.5));  // Đi 3 ngày cần ~8 quán trưa/tối
  const activityDayLimit = Math.max(4, Math.ceil(parsedDays * 1.5)); // Hoạt động ngày
  const activityNightLimit = Math.max(3, Math.ceil(parsedDays * 1.0)); // Hoạt động đêm

  // =========================================================================
  // 🍽️ PIPELINE: LỌC NHÀ HÀNG (Không giới hạn $limit để có nhiều dịch vụ ăn uống)
  // =========================================================================
  const restaurantPipeline = [
    // Trường hợp 1: Lọc thô hệ thống và ngân sách trần cho 1 bữa ăn
    { 
      $match: { 
        type: "RESTAURANT",
        approvalStatus: "APPROVED",
        ...(budget ? { finalPrice: { $lte: restaurantBudgetLimit } } : {})
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
            { $multiply: ["$totalAvailableSlots", 0.01] }
          ]
        }
      }
    },
    { $sort: { matchScore: -1 } }, // Sắp xếp chỗ tốt lên đầu nhưng GIỮ LẠI toàn bộ danh sách hợp lệ
    {
      $facet: {
        breakfast: [
          { $match: { features: "BREAKFAST" } },
          { $limit: breakfastLimit } 
        ],
        mainMeals: [
          { $match: { features: { $in: ["LUNCH", "DINNER", "ALL_DAY"] } } },
          { $limit: mainMealLimit } 
        ]
      }
    },
    {
      $project: {
        allCombined: { $setUnion: ["$breakfast", "$mainMeals"] }
      }
    },
    { $unwind: "$allCombined" },
    { $replaceRoot: { newRoot: "$allCombined" } }
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
        ...(budget ? { finalPrice: { $lte: activityBudgetLimit } } : {})
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
            { $multiply: ["$totalAvailableSlots", 0.01] }
          ]
        }
      }
    },
    { $sort: { matchScore: -1 } },
    {
      $facet: {
        daytime: [
          { $match: { features: { $in: ["SUNRISE", "MORNING", "AFTERNOON", "SIGHTSEEING", "CULTURAL", "NATURE_ADVENTURE"] } } },
          { $limit: activityDayLimit }
        ],
        nighttime: [
          { $match: { features: { $in: ["SUNSET", "NIGHT", "NIGHTLIFE"] } } },
          { $limit: activityNightLimit }
        ]
      }
    },
    {
      $project: {
        allCombined: { $setUnion: ["$daytime", "$nighttime"] }
      }
    },
    { $unwind: "$allCombined" },
    { $replaceRoot: { newRoot: "$allCombined" } }
  ];

  // 🚀 KÍCH HOẠT SONG SONG CẢ 3 LUỒNG BẰNG PROMISE.ALL (TỐC ĐỘ TỐI ĐA)
  let [availableHotels, availableRestaurants, availableActivities] = await Promise.all([
    Service.aggregate(hotelPipeline),
    Service.aggregate(restaurantPipeline),
    Service.aggregate(activityPipeline)
  ]);

  if (availableHotels.length === 0) {
    console.warn("⚠️ Không tìm thấy khách sạn hợp lệ, kích hoạt fallback hiển thị...");
    const fallbackPipeline = [
      { $match: { type: "HOTEL", approvalStatus: "APPROVED" } },
      {
        $addFields: {
          matchScore: {
            $add: [
              { $cond: { if: { $gt: [{ $size: { $setIntersection: ["$features", userSegments] } }, 0] }, then: 1000, else: 0 } },
              { $multiply: [{ $ifNull: ["$ratingStats.averageRating", 0] }, 10] }
            ]
          }
        }
      },
      { $sort: { matchScore: -1 } },
      { $limit: 6 }
    ];
    availableHotels = await Service.aggregate(fallbackPipeline);
  }

  // 🛡️ CỨU HỘ NHÀ HÀNG: Nếu dính ngân sách thấp làm mảng rỗng, lấy các quán rẻ nhất hiện có
  if (availableRestaurants.length === 0) {
    console.warn("⚠️ Không tìm thấy nhà hàng hợp ngân sách trần, đang tự động nới lỏng...");
    const fallbackRestaurant = [
      { $match: { type: "RESTAURANT", approvalStatus: "APPROVED" } },
      { $sort: { finalPrice: 1 } }, // Ưu tiên quán giá từ thấp đến cao
      { $limit: 15 }
    ];
    availableRestaurants = await Service.aggregate(fallbackRestaurant);
  }

  // 🛡️ CỨU HỘ HOẠT ĐỘNG: Nếu dính ngân sách thấp làm mảng rỗng, lấy hoạt động giá tốt nhất
  if (availableActivities.length === 0) {
    console.warn("⚠️ Không tìm thấy hoạt động hợp ngân sách trần, đang tự động nới lỏng...");
    const fallbackActivity = [
      { $match: { type: "ACTIVITY", approvalStatus: "APPROVED" } },
      { $sort: { finalPrice: 1 } },
      { $limit: 12 }
    ];
    availableActivities = await Service.aggregate(fallbackActivity);
  }

  return {
    hotels: availableHotels,
    restaurants: availableRestaurants,
    activities: availableActivities,
  };
};