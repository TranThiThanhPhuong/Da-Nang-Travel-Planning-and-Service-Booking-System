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

router.use(verifyClerkToken, requireRole('OWNER'));
router.post('/', createService);
router.get('/my', getMyServices);
router.get('/:id', getServiceById);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;