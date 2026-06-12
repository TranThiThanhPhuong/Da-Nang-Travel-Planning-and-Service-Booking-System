export const FEATURES_CONFIG = {
  HOTEL: [
    {
      title: "Loại hình lưu trú",
      items: [
        { value: "LUXURY", label: "Cao cấp" },
        { value: "MID_RANGE", label: "Tầm trung" },
        { value: "BUDGET", label: "Tiết kiệm" },
        { value: "BOUTIQUE", label: "Boutique" },
        { value: "HOMESTAY", label: "Homestay" },
      ],
    },
    {
      title: "Vị trí & Không gian",
      items: [
        { value: "BEACHFRONT", label: "Giáp biển" },
        { value: "RIVERSIDE", label: "View sông" },
        { value: "CITY_CENTER", label: "Trung tâm" },
        { value: "NEAR_AIRPORT", label: "Gần sân bay" },
        { value: "MOUNTAIN_VIEW", label: "View núi" },
        { value: "QUIET_AREA", label: "Yên tĩnh" },
      ],
    },
    {
      title: "Tiện ích nổi bật",
      items: [
        { value: "INFINITY_POOL", label: "Hồ bơi vô cực" },
        { value: "ROOFTOP_BAR", label: "Rooftop Bar" },
        { value: "SPA_WELLNESS", label: "Spa & Massage" },
        { value: "PRIVATE_BEACH", label: "Bãi biển riêng" },
        { value: "GYM_247", label: "Phòng Gym 24/7" },
        { value: "BREAKFAST_INCLUDED", label: "Bao gồm ăn sáng" },
        { value: "AIRPORT_SHUTTLE", label: "Đưa đón sân bay" },
      ],
    },
    {
      title: "Phù hợp cho",
      items: [
        { value: "FAMILY", label: "Gia đình" },
        { value: "COUPLE", label: "Cặp đôi" },
        { value: "BUSINESS", label: "Công tác" },
        { value: "SOLO_TRAVELER", label: "Du lịch một mình" },
        { value: "GROUP_FRIENDS", label: "Nhóm bạn" },
        { value: "SENIOR_FRIENDLY", label: "Người cao tuổi" },
        { value: "KID_SAFE", label: "An toàn cho bé" },
        { value: "PET_FRIENDLY", label: "Thú cưng" },
      ],
    },
    {
      title: "Phong cách",
      items: [
        { value: "MODERN", label: "Hiện đại" },
        { value: "CLASSIC", label: "Cổ điển" },
        { value: "MINIMALIST", label: "Tối giản" },
        { value: "ROMANTIC", label: "Lãng mạn" },
        { value: "ECO_FRIENDLY", label: "Thân thiện MT" },
      ],
    },
  ],

  RESTAURANT: [
    {
      title: "Loại ẩm thực",
      items: [
        { value: "LOCAL_FOOD", label: "Đặc sản" },
        { value: "SEAFOOD", label: "Hải sản" },
        { value: "FINE_DINING", label: "Fine Dining" },
        { value: "STREET_FOOD", label: "Đường phố" },
        { value: "VEGAN", label: "Đồ chay" },
        { value: "WESTERN", label: "Món Âu" },
        { value: "ASIAN", label: "Món Á" },
        { value: "BBQ", label: "BBQ" },
        { value: "HOTPOT", label: "Lẩu" },
      ],
    },
    {
      title: "Không gian",
      items: [
        { value: "OUTDOOR", label: "Ngoài trời" },
        { value: "PRIVATE_ROOM", label: "Phòng riêng" },
        { value: "ROOFTOP", label: "Sân thượng" },
        { value: "GARDEN", label: "Sân vườn" },
        { value: "RIVERSIDE_VIEW", label: "View sông" },
        { value: "ROMANTIC", label: "Lãng mạn" },
        { value: "CASUAL", label: "Thoải mái" },
      ],
    },
    {
      title: "Dịch vụ",
      items: [
        { value: "LIVE_MUSIC", label: "Nhạc sống" },
        { value: "DELIVERY", label: "Giao hàng" },
        { value: "KIDS_MENU", label: "Menu trẻ em" },
        { value: "CRAFT_BEER", label: "Bia thủ công" },
        { value: "WINE_CELLAR", label: "Hầm rượu" },
        { value: "HALAL", label: "Halal" },
      ],
    },
    {
      title: "Phù hợp cho",
      items: [
        { value: "GOOD_FOR_GROUPS", label: "Phù hợp nhóm" },
        { value: "COUPLE", label: "Cặp đôi" },
        { value: "FAMILY", label: "Gia đình" },
        { value: "INSTAGRAMMABLE", label: "Góc sống ảo" },
        { value: "QUICK_BITES", label: "Ăn nhanh" },
      ],
    },
    {
      title: "Thời gian phục vụ",
      items: [
        { value: "BREAKFAST", label: "Ăn sáng" },
        { value: "LUNCH", label: "Ăn trưa" },
        { value: "DINNER", label: "Ăn tối" },
        { value: "LATE_NIGHT", label: "Ăn đêm" },
        { value: "ALL_DAY", label: "Cả ngày" },
      ],
    },
  ],

  ACTIVITY: [
    {
      title: "Loại trải nghiệm",
      items: [
        { value: "CULTURAL", label: "Văn hóa" },
        { value: "NATURE_ADVENTURE", label: "Khám phá TN" },
        { value: "ENTERTAINMENT", label: "Giải trí" },
        { value: "WORKSHOP", label: "Workshop" },
        { value: "NIGHTLIFE", label: "Về đêm" },
        { value: "WATER_SPORTS", label: "Thể thao nước" },
        { value: "SIGHTSEEING", label: "Tham quan" },
      ],
    },
    {
      title: "Mức độ hoạt động",
      items: [
        { value: "RELAXING", label: "Thư giãn" },
        { value: "MODERATE", label: "Vừa phải" },
        { value: "HIGH_ENERGY", label: "Năng động" },
      ],
    },
    {
      title: "Thời gian & Không gian phù hợp",
      items: [
        { value: "SUNRISE", label: "Bình minh" },
        { value: "MORNING", label: "Buổi sáng" },
        { value: "AFTERNOON", label: "Buổi chiều" },
        { value: "SUNSET", label: "Hoàng hôn" },
        { value: "NIGHT", label: "Buổi tối" },
        { value: "INDOOR", label: "Trong nhà" },
      ],
    },
    {
      title: "Khu vực",
      items: [
        { value: "BA_NA_HILLS", label: "Bà Nà Hills" },
        { value: "SON_TRA", label: "Sơn Trà" },
        { value: "HOI_AN", label: "Hội An" },
        { value: "MARBLE_MOUNTAIN", label: "Ngũ Hành Sơn" },
        { value: "MY_KHE_BEACH", label: "Biển Mỹ Khê" },
      ],
    },
    {
      title: "Phù hợp cho",
      items: [
        { value: "FAMILY", label: "Gia đình" },
        { value: "GROUP_FRIENDS", label: "Nhóm bạn" },
        { value: "SOLO_TRAVELER", label: "Du lịch một mình" },
        { value: "THRILL_SEEKER", label: "Mạo hiểm" },
      ],
    },
  ],
};