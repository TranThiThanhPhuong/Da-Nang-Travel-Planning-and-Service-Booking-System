// server/concurrency-test.js
import axios from 'axios';

const TARGET_API_URL = 'http://localhost:5000/api/bookings';
// Thay đổi Token JWT giả lập phù hợp lấy từ ứng dụng của bạn
const MOCK_JWT_TOKEN = "BYPASS_CLERK_AUTH_FOR_CONCURRENCY_TEST";

const simulateConcurrentBookings = async () => {
    console.log("⚡ BẮT ĐẦU GIẢ LẬP KIỂM THỬ ĐỒNG THỜI D-PULSE...");

    // Cấu hình payload đặt phòng mẫu (yêu cầu đặt 1 phòng)
    const bookingPayload = {
        serviceId: "6a12a4949702095ce690b840", // Thay thế bằng ID dịch vụ thực tế đang còn 1 chỗ trống
        checkInDate: "2026-10-15",
        checkOutDate: "2026-10-16",
        quantity: 1,
        customerInfo: {
            fullName: "Khách hàng Test Đồng Thời",
            phoneNumber: "0905111222",
            email: "concurrency_test@gmail.com"
        }
    };

    const headers = {
        'Authorization': `Bearer ${MOCK_JWT_TOKEN}`,
        'Content-Type': 'application/json'
    };

    // Tạo mảng gồm 20 lời hứa gọi API gửi đồng thời
    const requestPromises = Array(20).fill(null).map((_, index) => {
        return axios.post(TARGET_API_URL, bookingPayload, { headers })
            .then(res => ({
                id: index + 1,
                status: res.status,
                data: res.data
            }))
            .catch(err => ({
                id: index + 1,
                status: err.response ? err.response.status : 'ERR_NETWORK',
                error: err.response ? err.response.data.message : err.message
            }));
    });

    console.log("🚀 Đang bắn đồng thời 20 yêu cầu đặt phòng lên Express Server...");
    const results = await Promise.all(requestPromises);

    // Thống kê kết quả nhận về
    let successCount = 0;
    let failureCount = 0;

    results.forEach(res => {
        if (res.status === 201) {
            successCount++;
            console.log(`✅ [Yêu cầu #${res.id}] THÀNH CÔNG (HTTP 201). Mã đơn: ${res.data.data.bookingCode}`);
        } else {
            failureCount++;
            console.log(`❌ [Yêu cầu #${res.id}] THẤT BẠI (HTTP ${res.status}). Lý do: ${res.error}`);
        }
    });

    console.log("\n================ TỔNG HỢP KẾT QUẢ KIỂM THỬ ================");
    console.log(`- Tổng số yêu cầu gửi đi: 20`);
    console.log(`- Số lượng giao dịch được tạo thành công: ${successCount}`);
    console.log(`- Số lượng giao dịch bị từ chối an toàn: ${failureCount}`);
    console.log("==========================================================");
};

simulateConcurrentBookings();