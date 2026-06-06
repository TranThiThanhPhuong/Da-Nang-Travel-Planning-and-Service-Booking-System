import express from 'express';
import {
    getServices,
    createService,
    getMyServices,
    getServiceById,
    updateService,
    deleteService,
    getPremiumBannerServices,
    getAllServicesForAdmin,
    reviewService,
    getAIRecommendations
} from '../controllers/serviceController.js';
import { verifyClerkToken } from '../middlewares/auth.js';
import { requireRole, checkRole } from '../middlewares/roleCheck.js';
import { checkServiceQuota } from '../middlewares/saasGuard.js';

const router = express.Router();

// Route công khai công cộng
router.get('/', getServices);
router.get('/premium-banners', getPremiumBannerServices);

// Route dành cho Admin (Đặt TRƯỚC route có tham số /:id để tránh trùng khớp)
router.get('/admin/all', verifyClerkToken, checkRole(['ADMIN']), getAllServicesForAdmin);
router.patch('/admin/:id/review', verifyClerkToken, checkRole(['ADMIN']), reviewService);

// Route dành cho User / Owner
router.get('/my', verifyClerkToken, requireRole('OWNER'), getMyServices);
router.get('/recommendations', verifyClerkToken, getAIRecommendations);

router.post('/', verifyClerkToken, requireRole('OWNER'), checkServiceQuota, createService);
router.put('/:id', verifyClerkToken, requireRole('OWNER'), updateService);
router.delete('/:id', verifyClerkToken, requireRole('OWNER'), deleteService);

// Route động có tham số 
router.get('/:id', getServiceById);

export default router;