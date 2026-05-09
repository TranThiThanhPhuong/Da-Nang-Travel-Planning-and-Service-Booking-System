import axios from "axios";
import Service from "../models/Service.js";

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

    // ⭐ LẤY SERVICES
    const services = await Service.find({
      approvalStatus: "APPROVED",
      $or: [
        { address: new RegExp(destination, "i") },
        { name: new RegExp(destination, "i") },
      ],
    })
      .select("_id name type address finalPrice")
      .limit(20)
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

    // ⭐ CALL OPENROUTER
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",

        messages: [
          {
            role: "system",
            content: `
Bạn là AI chuyên tạo lịch trình du lịch.

BẮT BUỘC:
- Chỉ trả JSON hợp lệ
- Không markdown
- Không giải thích
- Không dùng \`\`\`
- Không text ngoài JSON

Nếu không tạo được dữ liệu thì trả:
{
  "title": "",
  "summary": "",
  "estimatedBudget": 0,
  "itinerary": []
}
`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.3,
        max_tokens: 3000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    // ⭐ GET RAW AI TEXT
    const text = response.data.choices?.[0]?.message?.content;

    console.log("RAW AI RESPONSE:\n", text);

    if (!text) {
      throw new Error("AI không trả dữ liệu");
    }

    // ⭐ REMOVE MARKDOWN
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // ⭐ PARSE JSON
    let itineraryData = null;

    try {
      itineraryData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON PARSE ERROR:", parseError);
      console.error("CLEANED TEXT:", cleanedText);

      throw new Error("AI trả JSON không hợp lệ");
    }

    // ⭐ VALIDATE
    if (
      !itineraryData ||
      !itineraryData.title ||
      !Array.isArray(itineraryData.itinerary)
    ) {
      throw new Error("Dữ liệu lịch trình không hợp lệ");
    }

    return itineraryData;
  } catch (error) {
    console.error(
      "OpenRouter AI Error:",
      error.response?.data || error.message,
    );

    throw new Error(error.message || "Không thể tạo lịch trình AI");
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
  return `
Bạn là D-PULSE AI.

Hãy tạo lịch trình du lịch chi tiết.

==================================================
THÔNG TIN KHÁCH HÀNG
==================================================

- Điểm đến: ${destination}
- Số ngày: ${days}
- Ngày bắt đầu: ${startDate}
- Ngân sách: ${budget || "Linh hoạt"}
- Phong cách: ${travelStyle}
- Sở thích: ${preferences || "Không có"}
- Số người: ${peopleCount}

==================================================
DỊCH VỤ NỘI BỘ D-PULSE
==================================================

${JSON.stringify(services)}

==================================================
YÊU CẦU
==================================================

1. Ưu tiên dùng dịch vụ nội bộ D-PULSE trước
2. Nếu activity dùng service nội bộ:
   - phải gắn đúng serviceId
3. Nếu không có:
   - serviceId = null
4. Mỗi ngày 4-6 activities
5. Lịch trình hợp lý về thời gian
6. Tối ưu khoảng cách di chuyển
7. Chỉ trả JSON
8. Không markdown
9. Không giải thích

==================================================
FORMAT JSON
==================================================

{
  "title": "Tên chuyến đi",
  "summary": "Mô tả ngắn",
  "estimatedBudget": 5000000,
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "2026-05-10",
      "activities": [
        {
          "time": "08:00",
          "activityName": "Ăn sáng",
          "address": "Đà Nẵng",
          "serviceId": null,
          "description": "Mô tả"
        }
      ]
    }
  ]
}

CHỈ TRẢ JSON.
`;
};