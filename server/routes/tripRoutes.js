import express from 'express';
import {
  generateTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  confirmTrip,
} from '../controllers/tripController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(verifyClerkToken);

router.post('/generate', generateTrip);
router.get('/', getMyTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.patch('/:id/confirm', confirmTrip);

export default router;