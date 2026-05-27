import express from 'express';
import {
  uploadDocuments,
  submitApplication,
  getAllApplications,
  reviewApplication,
  getMyApplicationStatus,
  cancelApplication,
  getPaymentConfig,      
  updatePaymentConfig
} from '../controllers/ownerApplicationController.js';
import { verifyClerkToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleCheck.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.post('/upload', verifyClerkToken, upload.array('files', 32), uploadDocuments);
router.post('/', verifyClerkToken, submitApplication);
router.get('/my-status', verifyClerkToken, getMyApplicationStatus);
router.get('/payment-config', verifyClerkToken, getPaymentConfig);
router.put('/payment-config', verifyClerkToken, updatePaymentConfig);
router.get('/', verifyClerkToken, requireRole('ADMIN'), getAllApplications);
router.patch('/:id', verifyClerkToken, requireRole('ADMIN'), reviewApplication);
router.delete('/:id', verifyClerkToken, cancelApplication);

export default router;