import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import dns from 'node:dns';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import ownerApplicationRoutes from './routes/ownerApplicationRoutes.js';
import ownerSaaSRoutes from './routes/ownerSaaSRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminSaaSRoutes from './routes/adminSaaSRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import initCronJobs from './utils/cronJobs.js';
import errorHandler from './middlewares/errorHandler.js';
import ApiError from './utils/ApiError.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

dns.setServers(['1.1.1.1', '1.0.0.1']);
const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

global.io = io;

// MIDDLEWARE BẢO MẬT: Xác thực Token trước khi cho phép kết nối Socket
io.use(async (socket, next) => {
    try {
        // Lấy token từ nhiều nguồn để tránh sót (auth object hoặc headers)
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        // 🟢 THAY THẾ: Sử dụng verifyToken thay vì authenticateRequest để tránh lỗi header-missing
        const decodedToken = await clerkClient.verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        if (!decodedToken || !decodedToken.sub) {
            console.error("⚠️ [Socket Auth Fail]: Token giải mã không hợp lệ hoặc thiếu Subject (User ID)");
            return next(new Error('Authentication error: Invalid token'));
        }

        // Đính kèm thông tin User ID (Trong JWT của Clerk, trường 'sub' chính là User ID gốc: user_...)
        socket.user = {
            _id: decodedToken.sub,
        };

        console.log(`✅ [Socket Auth Success]: Thiết bị kết nối hợp lệ. User: ${socket.user._id}`);
        next();
    } catch (err) {
        console.error("❌ Lỗi hệ thống khi giải mã Token Clerk:", err.message);
        return next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`🔌 Thiết bị kết nối Socket thành công: ${socket.id} (User: ${socket.user._id})`);

    socket.on('join-channels', (data) => {
        if (data?.userId) {
            // 1. Tham gia phòng cá nhân như bình thường (Dành cho thông báo riêng tư)
            const personalRoom = `${data.role}_${data.userId}`;
            socket.join(personalRoom);
            console.log(`👥 Client tham gia phòng cá nhân: ${personalRoom}`);

            // 🟢 TÍCH HỢP THÊM: Nếu role là ADMIN, tự động cho join thêm vào phòng ADMIN_ROOM chung
            if (data.role === 'ADMIN') {
                socket.join('ADMIN_ROOM');
                console.log(`👑 Admin (ID: ${data.userId}) đã tham gia vào phòng tổng: ADMIN_ROOM`);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Thiết bị ngắt kết nối: ${socket.id}`);
    });
});

// Middleware
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// Database Connection
connectDB();

initCronJobs();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/owner-applications', ownerApplicationRoutes);
app.use('/api/owner/saas', ownerSaaSRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/saas', adminSaaSRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Bắt lỗi 404 Not Found
app.all('*', (req, res, next) => {
    next(new ApiError(404, `Không tìm thấy đường dẫn ${req.originalUrl} trên máy chủ!`));
});

// Trạm Xử Lý Lỗi Toàn Cục
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});