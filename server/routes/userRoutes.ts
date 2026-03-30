import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser, getUserStats, banUser, unbanUser, createUser } from '../controllers/userController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = express.Router();

router.post('/', authenticate, authorize(['admin']), createUser);
router.get('/', authenticate, authorize(['admin']), getUsers);
router.get('/stats', authenticate, getUserStats);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.put('/:id/ban', authenticate, authorize(['admin']), banUser);
router.put('/:id/unban', authenticate, authorize(['admin']), unbanUser);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

export default router;
