import express from 'express';
import {
  bulkUpdateInventory,
  getMonthlyInventory,
  updateInventory,
  deleteInventory,
  getMyServices,
} from '../controllers/inventoryController.js';
import { verifyClerkToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleCheck.js';

const router = express.Router();

router.use(verifyClerkToken);
router.use(requireRole('OWNER'));

router.get('/my-services', getMyServices);
router.post('/bulk', bulkUpdateInventory);
router.get('/:serviceId', getMonthlyInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;