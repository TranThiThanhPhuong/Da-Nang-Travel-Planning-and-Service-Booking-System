import express from 'express';
import { createBooking, getMyBookings, getAllBookings, cancelBooking, confirmOwnerRefund } from '../controllers/bookingController.js';
import { verifyClerkToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleCheck.js';

const router = express.Router();

// Chỉ User đã đăng nhập mới được đặt phòng
router.post('/', verifyClerkToken, createBooking);
router.get('/my-bookings', verifyClerkToken, getMyBookings);
router.get('/service-bookings', verifyClerkToken, requireRole('OWNER'), getAllBookings);
router.post('/:id/cancel', verifyClerkToken, cancelBooking);
router.patch('/confirm-owner-refund/:id', verifyClerkToken, requireRole('OWNER'), confirmOwnerRefund);

export default router;