import express from 'express';
import {
    getUsers,
    getUserDetails,
    updateUserStatus
} from '../controllers/adminController.js';
import { verifyClerkToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// 1. Phải có token hợp lệ từ Clerk
// 2. Role phải là 'ADMIN'
router.use(verifyClerkToken, isAdmin);

// Lấy danh sách người dùng (GET /api/admin/users)
router.get('/users', getUsers);

// Lấy chi tiết 1 người dùng (GET /api/admin/users/:id)
router.get('/users/:id', getUserDetails);

// Cập nhật trạng thái Khóa/Mở khóa (PATCH /api/admin/users/:id/status)
router.patch('/users/:id/status', updateUserStatus);

export default router;