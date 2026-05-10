import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import dns from 'node:dns';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import ownerApplicationRoutes from './routes/ownerApplicationRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import ApiError from './utils/ApiError.js';

dns.setServers(['1.1.1.1', '1.0.0.1']);
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/owner-applications', ownerApplicationRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});