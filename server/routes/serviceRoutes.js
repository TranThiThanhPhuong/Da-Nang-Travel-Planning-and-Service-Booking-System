import express from 'express';
import {
    getServices,
    createService,
    getMyServices,
    getServiceById,
    updateService,
    deleteService,
} from '../controllers/serviceController.js';
import { verifyClerkToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleCheck.js';

const router = express.Router();

router.get('/', getServices);

router.get('/my', verifyClerkToken, requireRole('OWNER'), getMyServices);

router.post('/', verifyClerkToken, requireRole('OWNER'), createService);
router.put('/:id', verifyClerkToken, requireRole('OWNER'), updateService);
router.delete('/:id', verifyClerkToken, requireRole('OWNER'), deleteService);

router.get('/:id', getServiceById);

export default router;