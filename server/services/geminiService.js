import { GoogleGenerativeAI } from "@google/generative-ai";
import Service from "../models/Service.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateTripItinerary = async (userPreferences) => {
  try {
    const {
      destination,
      days,
      startDate,
      budget,
      travelStyle,
      preferences,
      peopleCount,
    } = userPreferences;

    const services = await Service.find({
      approvalStatus: "APPROVED",
      $or: [
        { address: new RegExp(destination, "i") },
        { name: new RegExp(destination, "i") },
      ],
    })
      .select(
        "_id name type address description pricePerUnit finalPrice thumbnail",
      )
      .lean();

    // ⭐ BUILD PROMPT
    const prompt = buildPrompt({
      destination,
      days,
      startDate,
      budget,
      travelStyle,
      preferences,
      peopleCount,
      services,
    });
    console.log(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const response = result.response;
    const text = response.text();

    // ⭐ PARSE JSON
    let itineraryData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      itineraryData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", text);
      throw new Error("Không thể parse JSON từ Gemini AI");
    }

    return itineraryData;
  } catch (error) {
    console.error("Gemini service error:", error);
    throw error;
  }
};

// ⭐ BUILD PROMPT
const buildPrompt = ({
  destination,
  days,
  startDate,
  budget,
  travelStyle,
  preferences,
  peopleCount,
  services,
}) => {
  const travelStyleMap = {
    RELAXATION: "Nghỉ dưỡng",
    EXPLORATION: "Khám phá",
    FAMILY: "Gia đình",
    COUPLE: "Cặp đôi",
    ADVENTURE: "Phiêu lưu",
  };

  return `Bạn là D-PULSE AI — chuyên gia lập kế hoạch du lịch thông minh tại Việt Nam.
Nhiệm vụ của bạn là xây dựng lịch trình du lịch tối ưu cho người dùng, đồng thời ưu tiên đề xuất các dịch vụ có sẵn trên hệ thống D-PULSE.

==================================================
THÔNG TIN NGƯỜI DÙNG
==================================================
- Điểm đến: ${destination}
- Số ngày: ${days}
- Ngày bắt đầu: ${startDate}
- Ngân sách: ${budget ? `${budget.toLocaleString("vi-VN")} VNĐ` : "Linh hoạt"}
- Phong cách du lịch: ${travelStyleMap[travelStyle] || travelStyle}
- Sở thích: ${preferences || "Không có"}
- Số người: ${peopleCount}

==================================================
DỊCH VỤ CÓ SẴN TRÊN HỆ THỐNG D-PULSE
==================================================
${JSON.stringify(services, null, 2)}

==================================================
YÊU CẦU QUAN TRỌNG
==================================================
1. Tạo lịch trình theo từng ngày.
2. Mỗi ngày phải có:
   - dayNumber (số thứ tự ngày)
   - date (ngày cụ thể theo format YYYY-MM-DD)
   - activities (danh sách hoạt động)

3. Mỗi activity phải gồm:
   - time (giờ bắt đầu, format HH:mm)
   - activityName (tên hoạt động)
   - address (địa chỉ cụ thể)
   - serviceId (ID dịch vụ từ danh sách trên, hoặc null nếu không có)
   - description (mô tả chi tiết)

==================================================
QUY TẮC ƯU TIÊN
==================================================
1. **Ưu tiên sử dụng dịch vụ nội bộ D-PULSE trước.**
2. Nếu có dịch vụ phù hợp:
   - BẮT BUỘC gắn serviceId từ danh sách trên
   - Sử dụng đúng _id của service
3. Nếu không có dịch vụ phù hợp:
   - serviceId = null
   - Có thể đề xuất địa điểm ngoài hệ thống
4. Ưu tiên:
   - Khoảng cách gần nhau
   - Tiết kiệm thời gian di chuyển
   - Phù hợp ngân sách
   - Phù hợp phong cách du lịch
5. Không tạo lịch trình phi thực tế.
6. Mỗi ngày nên có 4–6 hoạt động.
7. Có thời gian nghỉ ngơi hợp lý.
8. **Không giải thích dài dòng.**
9. **Chỉ trả về JSON hợp lệ.**
10. **Không markdown.**
11. **Không dùng \`\`\`json.**

==================================================
LOGIC PHONG CÁCH DU LỊCH
==================================================
- **Nghỉ dưỡng**: Resort, Cafe chill, Spa, Biển, Fine dining
- **Khám phá**: Văn hóa, Địa điểm local, Chợ đêm, Street food
- **Gia đình**: An toàn, Nhẹ nhàng, Ít di chuyển xa
- **Cặp đôi**: Sunset, Romantic dinner, View đẹp, Không gian riêng tư
- **Phiêu lưu**: Trekking, Lặn biển, Thể thao mạo hiểm

==================================================
FORMAT JSON BẮT BUỘC
==================================================
{
  "title": "Tên chuyến đi (VD: 3 ngày khám phá Đà Nẵng)",
  "summary": "Mô tả ngắn gọn về chuyến đi",
  "estimatedBudget": 5000000,
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "2026-05-10",
      "activities": [
        {
          "time": "08:00",
          "activityName": "Ăn sáng đặc sản địa phương",
          "address": "123 Đường ABC, Đà Nẵng",
          "serviceId": null,
          "description": "Thưởng thức món ăn nổi tiếng địa phương."
        },
        {
          "time": "10:00",
          "activityName": "Nhận phòng Khách sạn Mường Thanh",
          "address": "Đà Nẵng",
          "serviceId": "673abc123def456789",
          "description": "Khách sạn 5 sao gần biển."
        }
      ]
    }
  ]
}

==================================================
OUTPUT
==================================================
Chỉ trả về JSON hợp lệ duy nhất. Không thêm bất kỳ text nào khác.`;
};
