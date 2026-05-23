import express from 'express';
import { 
    getServiceReviews, 
    getReviewSummary,
    createReview 
} from '../controllers/reviewController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', verifyClerkToken, createReview);

router.get('/service/:serviceId', getServiceReviews);
router.get('/service/:serviceId/summary', getReviewSummary);

export default router;