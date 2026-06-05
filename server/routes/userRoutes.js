import express from 'express';
import { saveUserSearchKeyword } from '../controllers/userController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/save-search', verifyClerkToken, saveUserSearchKeyword);

export default router;