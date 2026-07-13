import { Router } from 'express';
import authRoutes from './authRoutes.js';
import addressRoutes from './addressRoutes.js';

const router = Router();

router.use(authRoutes);
router.use(addressRoutes);

export default router;