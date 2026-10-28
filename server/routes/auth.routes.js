import { Router } from 'express';
import { register, registerAdmin, login, adminLogin, getMe } from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// User auth routes (register accepts optional role: 'user' | 'admin')
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

// Dedicated Admin auth routes
router.post('/admin/register', registerAdmin);
router.post('/admin/login', adminLogin);

export default router;
