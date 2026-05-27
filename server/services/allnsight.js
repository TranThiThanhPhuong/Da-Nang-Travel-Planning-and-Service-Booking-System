import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// NÂNG CẤP SCHEMA: Ép cấu trúc nội dung ngắn gọn, dùng Tên thay vì ID, định dạng số rõ ràng
const dashboardInsightSchema = {
  type: SchemaType.OBJECT,
  properties: {
    healthScore: { type: SchemaType.INTEGER, description: "Điểm từ 1-100" },
    statusText: { type: SchemaType.STRING, description: "Nhận xét tổng quan cực ngắn dưới 8 từ" },
    executiveSummary: { type: SchemaType.STRING, description: "Tóm tắt tình hình tài chính trong đúng 1 đến 2 câu ngắn gọn." },
    signals: {
      type: SchemaType.ARRAY,
      description: "Danh sách 3 tín hiệu phân tích quan trọng",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "Gồm: 'SUCCESS', 'WARNING', 'OPPORTUNITY'" },
          title: { type: SchemaType.STRING, description: "Tiêu đề ngắn gọn dưới 6 từ" },
          content: { 
            type: SchemaType.STRING, 
            description: "Viết ngắn gọn, súc tích dưới 3 câu. KHÔNG dùng ID đơn hàng/dịch vụ, PHẢI dùng Tên dịch vụ (name). Giữ nguyên đơn vị tiền tệ gốc của data, phân tách hàng nghìn bằng dấu chấm (Ví dụ: 15.000.000đ, 500.000đ). Trình bày thông tin cốt lõi rõ ràng." 
          },
          action: { type: SchemaType.STRING, description: "Một hành động ngắn gọn, thực tế và cụ thể cho Owner" }
        },
        required: ["type", "title", "content", "action"]
      }
    }
  },
  required: ["healthScore", "statusText", "executiveSummary", "signals"]
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: dashboardInsightSchema,
  },
});

export const generateDashboardInsights = async (bookings = [], services = []) => {
  try {
    const cleanBookings = Array.isArray(bookings) ? bookings.map((b) => ({
      id: (b._id || b.id)?.toString(),
      status: b.status,
      serviceType: b.serviceId?.type || "HOTEL",
      serviceName: b.serviceId?.name || "Dịch vụ",
      totalPrice: b.bookingDetails?.totalPrice || 0,
      quantity: b.bookingDetails?.quantity || 0,
      penaltyAmount: b.cancellationDetails?.penaltyAmount || 0,
      date: b.paymentDetails?.paidAt || b.createdAt
    })) : [];

    const cleanServices = Array.isArray(services) ? services.map((s) => ({
      id: (s._id || s.id)?.toString(),
      name: s.name,
      type: s.type,
      averageRating: s.ratingStats?.averageRating || 0,
      totalReviews: s.ratingStats?.totalReviews || 0,
      approvalStatus: s.approvalStatus
    })) : [];

    // NÂNG CẤP PROMPT: Đưa ra bộ quy tắc nghiêm ngặt về Tiền tệ, Định dạng và Tên dịch vụ
    const prompt = `
      Bạn là một Trợ lý Giám đốc Tài chính và Vận hành chuỗi dịch vụ Du lịch/Khách sạn.
      Hãy phân tích dữ liệu kinh doanh năm 2026 sau để đưa ra các cảnh báo và cơ hội tối ưu.

      DỮ LIỆU ĐỐI SOÁT CHÍNH XÁC:
      1. Danh sách Đơn hàng: ${JSON.stringify(cleanBookings)}
      2. Danh sách Dịch vụ: ${JSON.stringify(cleanServices)}

      ⚠️ LUẬT BẮT BUỘC PHẢI TUÂN THỦ (QUYẾT ĐỊNH ĐẾN SỰ CHÍNH XÁC):
      1. TUYỆT ĐỐI KHÔNG tự ý quy đổi tiền tệ sang tỷ/triệu nếu làm sai lệch con số. Hãy giữ đúng định dạng số nguyên từ dữ liệu đầu vào và sử dụng dấu chấm (.) để phân tách hàng nghìn (Ví dụ: dữ liệu là 15000000 thì viết là 15.000.000đ).
      2. TUYỆT ĐỐI KHÔNG hiển thị chuỗi ID thô (như: 6a132ee2...). Hãy tra cứu trong dữ liệu đơn hàng để lấy Tên dịch vụ (serviceName) tương ứng để báo cáo cho Owner biết chính xác phòng nào, dịch vụ nào.
      3. Nội dung phân tích trong trường 'content' và 'action' phải đi thẳng vào vấn đề, cực kỳ ngắn gọn, không viết dài dòng văn tự, kết hợp thông tin trực quan.
      4. Tính toán tỷ lệ hủy đơn = (Số đơn có status là 'CANCELLED' / Tổng số đơn) * 100. Nếu tỷ lệ này > 20%, bắt buộc phải tạo 1 tín hiệu loại 'WARNING'.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith("```")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("❌ AI Insights Service Error:", error);
    return {
      healthScore: 50,
      statusText: "Hệ thống đang bảo trì",
      executiveSummary: "Không thể kết nối với Trợ lý AI lúc này.",
      signals: [
        {
          type: "WARNING",
          title: "Gián đoạn kết nối",
          content: "Dữ liệu phân tích thời gian thực tạm thời không khả dụng.",
          action: "Hãy F5 làm mới lại trang trung tâm điều hành."
        }
      ]
    };
  }
};