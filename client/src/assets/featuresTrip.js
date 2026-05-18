export const FEATURES_CONFIG = {
  HOTEL: [
    {
      title: "Loại hình lưu trú",
      items: [
        { value: "LUXURY", label: "Cao cấp" },
        { value: "MID_RANGE", label: "Tầm trung" },
        { value: "BUDGET", label: "Tiết kiệm" },
      ],
    },

    {
      title: "Vị trí & Không gian",
      items: [
        { value: "BEACHFRONT", label: "Sát biển / Gần biển" },
        { value: "CITY_CENTER", label: "Trung tâm thành phố" },
        { value: "MOUNTAIN_AREA", label: "Vùng núi / Ngoại ô" },
        { value: "RIVER_LAKE_SIDE", label: "Ven sông / Ven hồ" }
      ],
    },

    {
      title: "Phù hợp cho",
      items: [
        { value: "FAMILY", label: "Gia đình" },
        { value: "COUPLE", label: "Cặp đôi" },
        { value: "SOLO_TRAVELER", label: "1 người" },
        { value: "GROUP_FRIENDS", label: "Nhóm bạn" },
      ],
    },
  ],

  RESTAURANT: [
    {
      title: "Loại ẩm thực",
      items: [
        { value: "LOCAL_FOOD", label: "Đặc sản địa phương" },
        { value: "SEAFOOD", label: "Hải sản" },
        { value: "STREET_FOOD", label: "Ẩm thực đường phố" },
        { value: "VEGAN", label: "Thuần chay" },
        { value: "WESTERN", label: "Món Âu" },
        { value: "ASIAN", label: "Món Á" },
        { value: "BBQ", label: "BBQ" },
        { value: "HOTPOT", label: "Lẩu" },
      ],
    },
  ],

  ACTIVITY: [
    {
      title: "Loại trải nghiệm",
      items: [
        { value: "CULTURAL", label: "Văn hóa" },
        { value: "NATURE_ADVENTURE", label: "Thiên nhiên" },
        { value: "ENTERTAINMENT", label: "Giải trí" },
        { value: "WATER_SPORTS", label: "Thể thao nước" },
        { value: "SIGHTSEEING", label: "Tham quan" },
      ],
    },
  ],
};