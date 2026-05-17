import Redis from 'ioredis';
import Redlock from 'redlock';
import 'dotenv/config';

// 1. Khởi tạo kết nối Redis
const redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

redisClient.on('connect', () => console.log('✅ Redis Connected'));
redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

// 2. Cấu hình Redlock
const redlock = new Redlock(
    [redisClient],
    {
        driftFactor: 0.01, // Thời gian trôi dạt mạng
        retryCount: 3,     // Số lần thử lấy khóa nếu bị nghẽn
        retryDelay: 200,   // Khoảng cách mỗi lần thử (200ms)
        retryJitter: 200,  // Độ lệch ngẫu nhiên để tránh nghẽn cổ chai
    }
);

redlock.on('clientError', (err) => console.error('❌ Redlock Error:', err));

export { redisClient, redlock };