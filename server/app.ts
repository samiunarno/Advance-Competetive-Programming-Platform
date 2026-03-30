import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.ts';
import problemRoutes from './routes/problemRoutes.ts';
import submissionRoutes from './routes/submissionRoutes.ts';
import userRoutes from './routes/userRoutes.ts';
import messageRoutes from './routes/messageRoutes.ts';
import contestRoutes from './routes/contestRoutes.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createExpressApp() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/problems', problemRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/contests', contestRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  });

  return app;
}
