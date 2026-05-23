import express from 'express';
import { adminGetPackages, adminUpdatePackage, adminGetSaaSTransactions } from '../controllers/adminSaaSController.js';
import { verifyClerkToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Tất cả các tuyến đường dưới đây đều yêu cầu đăng nhập và có quyền ADMIN
router.use(verifyClerkToken, isAdmin);

router.get('/packages', adminGetPackages);
router.put('/packages/:id', adminUpdatePackage);
router.get('/transactions', adminGetSaaSTransactions);

export default router;