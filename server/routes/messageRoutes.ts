import express from 'express';
import { getMessages, sendMessage, adminReply, getAdminInbox, getMessagesForAdmin } from '../controllers/messageController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', authenticate, getMessages);
router.get('/admin/inbox', authenticate, authorize(['admin']), getAdminInbox);
router.get('/admin/user/:userId', authenticate, authorize(['admin']), getMessagesForAdmin);
router.post('/', authenticate, sendMessage);
router.post('/reply', authenticate, authorize(['admin']), adminReply);

export default router;
