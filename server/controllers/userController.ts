import { Request, Response } from 'express';
import { userService } from '../services/userService.ts';

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const user = await userService.banUser(req.params.id, reason);
    res.json({ message: 'User banned successfully', user });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'Failed to ban user', error: error.message });
    }
  }
};

export const unbanUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.unbanUser(req.params.id);
    res.json({ message: 'User unbanned successfully', user });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'Failed to unban user', error: error.message });
    }
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await userService.getUserStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};
