import { Router } from 'express';
import { getPendingPosts, approvePost, rejectPost } from '../controller/admin.controller.js';
import { adminLogin, registerAdmin } from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = Router();

// Public Admin Auth endpoints (no token needed yet)
router.post('/login', adminLogin);
router.post('/register', registerAdmin);

// Protected Admin Routes (require valid admin JWT)
router.use(authenticate, requireAdmin);

router.get('/posts/pending', getPendingPosts);
router.patch('/posts/approve/:id', approvePost);
router.patch('/posts/reject/:id', rejectPost);

export default router;
