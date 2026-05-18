import express from 'express';
import {
  generateTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  advanceTripStatus
} from '../controllers/tripController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(verifyClerkToken);

router.post('/generate', generateTrip);
router.put('/:id/advance-status', advanceTripStatus);
router.get('/', getMyTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

export default router;