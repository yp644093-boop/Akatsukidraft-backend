import { Router } from 'express';
import { uploadImage, uploadDocument } from '../controller/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadSingleImage, uploadSingleDocument } from '../middleware/multer.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/image', uploadSingleImage, uploadImage);
router.post('/document', uploadSingleDocument, uploadDocument);

export default router;
