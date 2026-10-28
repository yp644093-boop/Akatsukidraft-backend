import { Router } from 'express';
import {
  createPost, getPublicPosts, getPublicPostById,
  getMyPosts, updatePost, submitPost, deletePost
} from '../controller/post.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/multer.middleware.js';

const router = Router();

router.get('/', getPublicPosts);
router.get('/my-posts', authenticate, getMyPosts);
router.get('/:id', getPublicPostById);

router.post('/', authenticate, uploadSingleImage, createPost);
router.patch('/:id', authenticate, uploadSingleImage, updatePost);

router.post('/:id/submit', authenticate, submitPost);
router.patch('/:id/submit', authenticate, submitPost);

router.delete('/:id', authenticate, deletePost);

export default router;
