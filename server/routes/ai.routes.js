import { Router } from 'express';
import { improvePost } from '../controller/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/improve/:id', improvePost);
router.post('/improve', improvePost);

export default router;
