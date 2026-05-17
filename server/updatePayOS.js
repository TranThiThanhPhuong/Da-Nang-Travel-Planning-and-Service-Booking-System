import mongoose from 'mongoose';
import OwnerApplication from './models/OwnerApplication.js'; // Đảm bảo đường dẫn này chính xác

// 1. CHỖ ĐIỀN THÔNG TIN PAYOS ĐỂ TEST (DÙNG CHUNG CHO TẤT CẢ OWNER)
const PAYOS_TEST_CONFIG = {
    clientId: '1cfb9de9-909d-44c8-9d61-b17e8f00e492',
    apiKey: 'ec9f3f34-5d26-4058-b33b-ae95b80b3a07',
    checksumKey: 'a045e429d559b3e5b45b0a7a36649332b6966542a413e928a5ce5f7ad9336801'
};

// 2. CẤU HÌNH CHUỖI KẾT NỐI DATABASE
const MONGO_URI = 'mongodb+srv://dev:123456dpluse@d-pulse.pjbftxl.mongodb.net/d-pulseDB?appName=D-Pulse'; // Thay tên DB của bạn vào đây

async function runPayOSMigration() {
    try {
        console.log('--- 🚀 KHỞI ĐỘNG CẬP NHẬT CREDENTIALS PAYOS HÀNG LOẠT ---');

        // Kết nối cơ sở dữ liệu
        await mongoose.connect(MONGO_URI);
        console.log('✅ Đã kết nối thành công tới MongoDB.');
        console.log(`📂 Đang thực thi trên Collection: "${OwnerApplication.collection.name}"`);

        // Đếm số lượng ứng dụng hiện có trước khi update
        const totalDocs = await OwnerApplication.countDocuments({});
        console.log(`🔍 Tìm thấy tổng cộng: ${totalDocs} đơn đăng ký của Owner trong hệ thống.`);

        if (totalDocs === 0) {
            console.log('⏩ Không tìm thấy dữ liệu nào để cập nhật. Tiến trình dừng lại.');
            return;
        }

        // Kiểm tra xem bạn đã điền key hay chưa
        if (PAYOS_TEST_CONFIG.clientId.includes('ĐIỀN_') || PAYOS_TEST_CONFIG.apiKey.includes('ĐIỀN_')) {
            console.log('⚠️ Cảnh báo: Bạn chưa thay thế các chuỗi giữ chỗ bằng Key PayOS thật của mình!');
        }

        console.log('⏳ Đang tiến hành thực hiện updateMany dữ liệu...');

        // Tiến hành cập nhật đồng loạt
        // Lưu ý: Mặc dù schema cấu hình `select: false`, việc update bằng toán tử $set vẫn hoạt động trực tiếp ở tầng DB
        const result = await OwnerApplication.updateMany(
            {}, // Không truyền query để quét qua toàn bộ tài liệu trong collection
            {
                $set: {
                    payos: {
                        clientId: PAYOS_TEST_CONFIG.clientId,
                        apiKey: PAYOS_TEST_CONFIG.apiKey,
                        checksumKey: PAYOS_TEST_CONFIG.checksumKey
                    }
                }
            }
        );

        console.log('--- 🎉 QUÁ TRÌNH MIGRATION HOÀN TẤT ---');
        console.log(`- Tổng số bản ghi tìm thấy: ${result.matchedCount}`);
        console.log(`- Số bản ghi thực tế đã ghi đè dữ liệu: ${result.modifiedCount}`);

        // 3. TIẾN HÀNH KIỂM TRA BẢO MẬT (VERIFICATION)
        console.log('--- 🛡️ VERIFY DỮ LIỆU SAU KHI LƯU ---');

        // Do schema set `select: false`, ta cần dùng cấu trúc `.select('+payos.clientId')` để force-read dữ liệu lên kiểm tra
        const checkDoc = await OwnerApplication.findOne({}).select('+payos.clientId').lean();

        if (checkDoc && checkDoc.payos) {
            const isMatch = checkDoc.payos.clientId === PAYOS_TEST_CONFIG.clientId;
            console.log(`- Trạng thái Object PayOS: Đã được tạo thành công.`);
            console.log(`- Kiểm tra trùng khớp dữ liệu test: ${isMatch ? 'ĐÚNG HỢP LỆ ✅' : 'KHÔNG TRÙNG KHỚP ❌'}`);
        } else {
            console.log('❌ Kiểm tra thất bại: Trường payos vẫn trống hoặc chưa được lưu.');
        }

    } catch (error) {
        console.error('❌ ĐÃ XẢY RA LỖI TRONG QUÁ TRÌNH MIGRATION:', error.message);
    } finally {
        // Ngắt kết nối an toàn để giải phóng luồng terminal
        await mongoose.disconnect();
        console.log('🔌 Đã đóng kết nối với Database an toàn.');
        process.exit();
    }
}

runPayOSMigration();