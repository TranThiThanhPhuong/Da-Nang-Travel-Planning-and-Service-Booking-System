import express from 'express';
import { toggleWishlist, getMyWishlist } from '../controllers/wishlistController.js';
import { verifyClerkToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/toggle', verifyClerkToken, toggleWishlist);
router.get('/my-wishlists', verifyClerkToken, getMyWishlist);

export default router;