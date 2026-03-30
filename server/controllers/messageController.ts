import { Request, Response } from 'express';
import { messageService } from '../services/messageService.ts';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const messages = await messageService.getMessages(userId);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { content } = req.body;
    const message = await messageService.sendMessage(userId, 'user', content);
    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Admin endpoints could be added here to reply to specific users
export const adminReply = async (req: Request, res: Response) => {
    try {
        const { userId, content } = req.body;
        const message = await messageService.sendMessage(userId, 'admin', content);
        res.status(201).json(message);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to send reply', error: error.message });
    }
}

export const getAdminInbox = async (req: Request, res: Response) => {
  try {
    const conversations = await messageService.getAllConversations();
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch inbox', error: error.message });
  }
};

export const getMessagesForAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const messages = await messageService.getMessages(userId);
    await messageService.markAsRead(userId, 'admin');
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};
