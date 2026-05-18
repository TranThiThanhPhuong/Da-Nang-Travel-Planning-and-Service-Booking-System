import express from 'express';
import { createPaymentLink, verifyPayment, cancelPayment } from '../controllers/paymentController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create-link', verifyClerkToken, createPaymentLink);
router.get('/verify/:bookingId', verifyPayment);
router.post('/cancel/:bookingId', cancelPayment);

export default router;