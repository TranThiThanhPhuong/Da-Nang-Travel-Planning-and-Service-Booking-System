import express from 'express';
import { createBooking } from '../controllers/bookingController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

// Chỉ User đã đăng nhập mới được đặt phòng
router.post('/', verifyClerkToken, createBooking);

export default router;