import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../services/authService.ts';

export const register = async (req: Request, res: Response) => {
  try {
    await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { token, user } = await authService.login(req.body);
    
    if (user.is_banned) {
      return res.status(403).json({ 
        message: 'Your account has been suspended.', 
        reason: user.ban_reason 
      });
    }

    res.cookie('token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, is_banned: user.is_banned, ban_reason: user.ban_reason } });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await authService.getUserById(decoded.id);
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
