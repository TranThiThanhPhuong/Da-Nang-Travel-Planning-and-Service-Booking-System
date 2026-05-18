import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Định nghĩa cấu trúc JSON đầu ra nghiêm ngặt bằng Response Schema
const scheduleSchema = {
  type: SchemaType.ARRAY,
  description: "Danh sách lịch trình theo từng ngày",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      day: { type: SchemaType.INTEGER, description: "Số thứ tự ngày, bắt đầu từ 1" },
      date: { type: SchemaType.STRING, description: "Định dạng YYYY-MM-DD" },
      activities: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            time: { type: SchemaType.STRING, description: "Khung giờ diễn ra (Ví dụ: 08:00)" },
            serviceId: { type: SchemaType.STRING, description: "BẮT BUỘC: Chuỗi ID từ trường 'id' của dữ liệu đầu vào" },
            type: { type: SchemaType.STRING, description: "Loại dịch vụ (Ví dụ: RESTAURANT, ACTIVITY)" },
            name: { type: SchemaType.STRING, description: "Tên dịch vụ" },
            address: { type: SchemaType.STRING, description: "Địa chỉ dịch vụ" },
            price: { type: SchemaType.NUMBER, description: "Giá gốc của dịch vụ" },
            discountedPrice: { type: SchemaType.NUMBER, description: "Giá sau giảm (nếu có)" },
            discountPercentage: { type: SchemaType.NUMBER, description: "Phần trăm giảm giá (nếu có, ví dụ: 20 cho 20%)" },
            ratingStats: {
              type: SchemaType.OBJECT,
              properties: {
                averageRating: { type: SchemaType.NUMBER, description: "Điểm đánh giá trung bình" },
              },
              description: "Thống kê đánh giá của dịch vụ"
            },
            description: { type: SchemaType.STRING, description: "Mô tả ngắn gọn, hấp dẫn về trải nghiệm tại đây dựa trên thông tin dịch vụ (Không chứa thẻ HTML)" }
          },
          required: ["time", "serviceId", "name", "address", "price", "discountedPrice", "description"],
        },
      },
    },
    required: ["day", "date", "activities"],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: scheduleSchema, // Ép Schema ở đây giúp AI không bao giờ sai cấu trúc
  },
});

export const callAItoSchedule = async (tripData, restaurants, activities) => {
  try {
    // 1. Chuẩn hóa dữ liệu đầu vào, an toàn với ID và Tọa độ từ MongoDB
    const cleanRestaurants = restaurants.map((r) => ({
      id: (r._id || r.id)?.toString(), // Đảm bảo luôn lấy được String ID
      name: r.name,
      coords: r.location?.coordinates ? [r.location.coordinates[1], r.location.coordinates[0]] : [], // Chuyển thành [Latitude, Longitude]
      address: r.address,
      features: r.features || [],
      rating: r.ratingStats?.averageRating || r.rating || 0, // Khớp với Schema Service trước đó
      price: r.finalPrice || r.price || 0,
      description: r.description,
    }));

    const cleanActivities = activities.map((a) => ({
      id: (a._id || a.id)?.toString(),
      name: a.name,
      coords: a.location?.coordinates || a.coords || [],
      address: a.address,
      features: a.features || [],
      rating: a.ratingStats?.averageRating || a.rating || 0,
      price: a.finalPrice || a.price || 0,
      description: a.description
    }));

    const prompt = `
      Bạn là một chuyên gia lập kế hoạch du lịch chuyên nghiệp tại Đà Nẵng.
      Nhiệm vụ của bạn: Sắp xếp một lịch trình du lịch trong ${tripData.days} ngày từ ngày ${tripData.startDate} cho nhóm ${tripData.peopleCount} người.

      DỮ LIỆU ĐẦU VÀO:
      1. Danh sách Nhà hàng: ${JSON.stringify(cleanRestaurants)}
      2. Danh sách Hoạt động: ${JSON.stringify(cleanActivities)}
      3. Thể loại/Sở thích chuyến đi của người dùng: ${JSON.stringify(tripData.travelStyle || [])}

      - Trường 'serviceId' PHẢI lấy chính xác từ 'id'.
      - Các trường 'address', 'price', 'discountedPrice', PHẢI giữ nguyên giá trị chính xác từ dịch vụ được chọn trong dữ liệu đầu vào sang dữ liệu đầu ra tương ứng, không được tự bịa số liệu.
      - Đối với trường 'description': Hãy đọc hiểu trường 'rawDescription' của đầu vào (bỏ qua hoàn toàn các thẻ HTML như <strong>, <em> nếu có) để viết lại một câu mô tả ngắn gọn khoảng 2-3 câu thật hấp dẫn, lý giải vì sao khách nên trải nghiệm địa điểm này tại khung giờ đó.
      
      NGUYÊN TẮC SẮP XẾP VÀ ƯU TIÊN:
      1. LOGIC KHÔNG GIAN & ĐỊA LÝ :
      - Sử dụng trường 'coords' định dạng [Latitude, Longitude] và thông tin quận/tên đường ở trường 'address'.
      - Các địa điểm được xếp trong cùng một ngày PHẢI nằm cùng một khu vực/cụm địa lý dưới đây (KHÔNG xếp khác cụm trong cùng một buổi, tối ưu lộ trình theo vòng tròn hoặc tịnh tiến gần):
        * Cụm Trung Tâm (Hải Châu, Thanh Khê, Cẩm Lệ): Sân bay, Chợ Cồn, Chợ Hàn, các cây cầu. Các điểm cách nhau rất gần (<5km).
        * Cụm Biển (Sơn Trà, Ngũ Hành Sơn): Biển Mỹ Khê, Chùa Linh Ứng, Núi Ngũ Hành Sơn. Sơn Trà (Bắc) cách Ngũ Hành Sơn (Nam) 15-20km -> Không xếp 2 điểm này sát giờ nhau.
        * Cụm Phía Bắc (Liên Chiểu): Đèo Hải Vân, Rạn Nam Ô. Cách cụm Biển >15km -> Tuyệt đối không xếp Liên Chiểu và Ngũ Hành Sơn cùng một ngày.
        * Cụm Rất Xa (Hòa Vang): Bà Nà Hills. Cách trung tâm 30-40km -> Phải dành riêng ít nhất 1 buổi lớn (4-6 tiếng) hoặc cả ngày.
      - Nếu các dịch vụ lọc qua mà không được như các * trên thì thôi bạn cứ xếp hợp lí.

      2. KHỚP TAG THỜI GIAN THEO "FEATURES" PHỤC VỤ (BẮT BUỘC):
      - Khung giờ ăn uống bắt buộc dựa trên feature thời gian:
        + BREAKFAST: Xếp từ 07:00 - 09:30
        + LUNCH: Xếp từ 11:00 - 14:00
        + DINNER: Xếp từ 18:00 - 21:00
        + LATE_NIGHT: Xếp sau 21:00
      - Khung giờ trải nghiệm đặc thù:
        + SUNRISE: Đúng khung 05:00 - 06:30 | SUNSET: Đúng khung 16:30 - 18:00.
        + CULTURAL / SIGHTSEEING: Chỉ xếp vào ban ngày (Sáng hoặc Chiều).
        + WATER_SPORTS / NATURE_ADVENTURE: Chỉ xếp sáng sớm hoặc chiều mát, KHÔNG xếp buổi tối.
        + BA_NA_HILLS: Chiếm trọn thời gian từ 08:00 đến 16:00, không chèn bất kỳ hoạt động nào khác vào giữa khung giờ này.
      
      3. CÂN BẰNG MỖI NGÀY: 
      - Một ngày tiêu chuẩn nên phân bổ đan xen theo trục thời gian thực tế: 1 Breakfast (nếu có), 1 Lunch, 1 Dinner và khoảng 2 Activities (1 hoạt động sáng, 1 hoạt động chiều/tối).
      
      4. ĐIỀU KIỆN KHÔNG TRÙNG LẶP(QUAN TRỌNG NHẤT): 
      - Không lặp lại cùng một dịch vụ (cùng id) trong suốt cả chuyến đi.
      - Nếu không có thì sắp xếp cho đều các ngày là được, không được trùng service.

      5. PHÂN BỔ KHÔNG GIAN NHÀ HÀNG THEO THỜI GIAN THỰC:
      - Nếu một nhà hàng có feature 'ROOFTOP' hoặc 'ROMANTIC' hoặc 'RIVERSIDE_VIEW': Ưu tiên xếp vào bữa tối (DINNER) để khách ngắm cảnh thành phố hoặc sông Hàn lên đèn.
      - Nếu nhà hàng có feature 'STREET_FOOD' hoặc 'QUICK_BITES': Ưu tiên xếp vào bữa phụ hoặc bữa trưa (LUNCH).
      - Nếu nhà hàng có feature 'SEAFOOD': Ưu tiên xếp vào bữa tối (DINNER) gần khu vực ven biển 'BEACHFRONT'.

      6. ĐỒNG BỘ KHU VỰC GIỮA HOẠT ĐỘNG VÀ ĐỊA ĐIỂM ĂN UỐNG:
      - Nhìn vào nhóm feature 'Khu vực' của ACTIVITY (BA_NA_HILLS, SON_TRA, HOI_AN, MARBLE_MOUNTAIN, MY_KHE_BEACH): Nếu buổi chiều Activity diễn ra ở khu vực nào (ví dụ: HOI_AN), thì Nhà hàng ăn tối (DINNER) liền sau đó cũng phải có vị trí địa lý 'coords' gần khu vực đó hoặc nằm trên đường di chuyển từ khu vực đó về.

      7. ĐIỀU PHỐI ĐỐI TƯỢNG VÀ TRẢI NGHIỆM:
      - Nếu 'travelStyle' của user có 'THRILL_SEEKER' (Ưa mạo hiểm), hãy ưu tiên đẩy các Activity có feature 'WATER_SPORTS' hoặc 'NATURE_ADVENTURE' vào các khung giờ thể chất tốt (08:30 hoặc 14:30).
      - Nếu 'travelStyle' có 'FAMILY' hoặc 'GOOD_FOR_GROUPS', tuyệt đối không xếp các nhà hàng có không gian quá nhỏ hẹp hoặc các hoạt động quá tốn thể lực vào lịch trình.

      8. TỐI ƯU HÓA ĐIỂM ĐÁNH GIÁ (RATING) VÀ GIÁ CẢ (PRICE):
      - Trong số các dịch vụ đã khớp feature thành công, luôn luôn ưu tiên xếp dịch vụ có trường 'rating' cao hơn lên trước. 
      - Kiểm tra kỹ trường 'price' (đây chính là finalPrice của hệ thống), xếp các dịch vụ có giá rải đều hợp lý, tránh việc một ngày dồn quá nhiều dịch vụ đắt đỏ vượt mức chi trả trung bình.
      
      ⚠️ CHÚ Ý QUAN TRỌNG:
      - Trường 'serviceId' trong kết quả JSON phải lấy CHÍNH XÁC từ trường 'id' của dịch vụ được cung cấp.
      - KHÔNG bọc kết quả trong ký tự \`\`\`json \`\`\`. Chỉ trả về chuỗi JSON thuần túy.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Khử markdown nếu có
    if (text.startsWith("```")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("AI Schedule Error:", error);
    return null;
  }
};