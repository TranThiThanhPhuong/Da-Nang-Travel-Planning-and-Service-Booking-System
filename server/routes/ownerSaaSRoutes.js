import express from 'express';
import {
    getActivePackages,
    getMyTransactions,
    createSubscriptionPayment,
    verifySubscriptionPayment,
    cancelSubscriptionPayment,
    getMySaaSStatus,
    handlePayOSWebhook
} from '../controllers/ownerSaaSController.js';
import { verifyClerkToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleCheck.js';

const router = express.Router();

router.use(verifyClerkToken, requireRole('OWNER'));
router.post('/webhook', handlePayOSWebhook);

router.get('/packages', getActivePackages);
router.get('/transactions', getMyTransactions);
router.get('/status', getMySaaSStatus);
router.post('/pay', createSubscriptionPayment);
router.post('/verify', verifySubscriptionPayment);
router.post('/cancel', cancelSubscriptionPayment);

export default router;
