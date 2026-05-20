import express from 'express';
import { createBooking, getMyBookings } from '../controllers/bookingController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

// Chỉ User đã đăng nhập mới được đặt phòng
router.post('/', verifyClerkToken, createBooking);
router.get('/my-bookings', verifyClerkToken, getMyBookings);

export default router;