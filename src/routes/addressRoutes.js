import { Router } from 'express';
import addressMiddleware from '../middlewares/addressMiddleware.js';
import {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  shareAddress,
  getSharedAddress
} from '../controllers/addressController.js';

const router = Router();

// Rotas protegidas
router.post('/addresses', addressMiddleware, createAddress);
router.get('/addresses', addressMiddleware, getAddresses);
router.put('/addresses/:id', addressMiddleware, updateAddress);
router.delete('/addresses/:id', addressMiddleware, deleteAddress);
router.post('/addresses/:id/share', addressMiddleware, shareAddress);

// Rotas públicas
router.get('/shared/:token', getSharedAddress);


export default router;