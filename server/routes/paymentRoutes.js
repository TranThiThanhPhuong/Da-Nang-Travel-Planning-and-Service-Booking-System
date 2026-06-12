import express from 'express';
import { createPaymentLink, verifyPayment, cancelPayment, handleBookingWebhook } from '../controllers/paymentController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create-link', verifyClerkToken, createPaymentLink);
router.post('/webhook/booking', handleBookingWebhook);
router.get('/verify/:bookingId', verifyPayment);
router.post('/cancel/:bookingId', cancelPayment);

export default router;