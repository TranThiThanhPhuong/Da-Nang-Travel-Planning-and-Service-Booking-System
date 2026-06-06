// routes/notificationRoutes.js
import express from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';
import { verifyClerkToken } from '../middlewares/auth.js'; // Middleware xác thực của bạn

const router = express.Router();

router.use(verifyClerkToken); // Tất cả các hành động liên quan đến thông báo đều phải login

router.get('/', getMyNotifications);
router.post('/mark-read', markAsRead);

export default router;