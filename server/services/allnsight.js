import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const dashboardInsightSchema = {
  type: SchemaType.OBJECT,
  properties: {
    healthScore: { type: SchemaType.INTEGER, description: "Điểm sức khỏe kinh doanh từ 1-100 dựa trên doanh thu, đánh giá và tỷ lệ đơn hủy." },
    statusText: { type: SchemaType.STRING, description: "Nhận xét tổng quan cực ngắn dưới 8 từ (Ví dụ: Doanh thu ổn định, Cần tối ưu chính sách)" },
    executiveSummary: { type: SchemaType.STRING, description: "Tóm tắt bức tranh tài chính và vận hành trong đúng 1 đến 2 câu ngắn gọn." },
    signals: {
      type: SchemaType.ARRAY,
      description: "Danh sách các tín hiệu phân tích bất thường quan trọng. Nếu không có vấn đề gì cần lưu ý, mảng này có thể để rỗng.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "Gồm: 'SUCCESS' (Tăng trưởng đột biến), 'WARNING' (Rủi ro/Hủy đơn/Review tệ), 'OPPORTUNITY' (Tiềm năng nâng giá/Kích cầu)" },
          title: { type: SchemaType.STRING, description: "Tiêu đề ngắn gọn dưới 6 từ miêu tả trực diện vấn đề" },
          content: { 
            type: SchemaType.STRING, 
            description: "Phân tích số liệu súc tích dưới 3 câu. BẮT BUỘC chỉ đích danh Tên dịch vụ (serviceName). Gom nhóm cụ thể xem dịch vụ nào bị hủy nhiều nhất, tổng doanh thu thất thoát bao nhiêu, lý do hay gặp tại trường 'reason' là gì, hoặc dịch vụ nào có điểm review thấp cần cải thiện." 
          },
          action: { type: SchemaType.STRING, description: "Một hành động giải quyết cụ thể, thực tế cho chủ cơ sở" }
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
      cancelReason: b.cancellationDetails?.reason || "",
      penaltyAmount: b.cancellationDetails?.penaltyAmount || 0,
      refundAmount: b.cancellationDetails?.refundAmount || 0,
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

    const prompt = `
      Bạn là Trợ lý Giám đốc Tài chính & Giám sát Vận hành chuỗi dịch vụ du lịch. 
      Hãy phân tích sâu sắc tập dữ liệu năm 2026 sau đây để tìm ra điểm nghẽn.

      DỮ LIỆU THỰC TẾ:
      1. Đơn hàng (Bookings): ${JSON.stringify(cleanBookings)}
      2. Dịch vụ (Services): ${JSON.stringify(cleanServices)}

      ⚠️ CHỈ THỊ PHÂN TÍCH CHUYÊN SÂU & LỌC TÍN HIỆU:
      1. ĐỐI VỚI ĐƠN HỦY (status = 'CANCELLED'): Hãy truy vết xem đơn hủy tập trung nhiều nhất ở Tên dịch vụ (serviceName) nào. Cộng tổng số tiền thất thoát (totalPrice). Tổng hợp lý do khách điền ở trường 'cancelReason' xem đâu là nguyên nhân phổ biến nhất (Ví dụ: đổi lịch, trùng phòng, lý do cá nhân...).
      2. ĐỐI VỚI REVIEW & DOANH THU: Quét xem có dịch vụ nào bị đánh giá thấp (averageRating < 4.0 nhưng có nhiều totalReviews) hoặc dịch vụ nào đột biến doanh thu cao để làm tín hiệu.
      3. ĐỊNH DẠNG SỐ: Giữ nguyên số nguyên gốc của dữ liệu đầu vào và sử dụng dấu chấm (.) để phân tách hàng nghìn (Ví dụ: 12.500.000đ).
      4. BỘ LỌC NGHIÊM NGẶT: Nếu tỷ lệ hủy đơn toàn hệ thống dưới 15% và không có dịch vụ nào bị đánh giá tệ hoặc thất thoát tiền nghiêm trọng, mảng 'signals' CÓ THỂ ĐỂ TRỐNG rỗng. Không tự rặn ra cảnh báo nếu mọi thứ đang vận hành hoàn hảo.
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