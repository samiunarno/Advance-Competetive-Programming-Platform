import mongoose from 'mongoose';
import { achievementService } from './services/achievementService.ts';
import { problemService } from './services/problemService.ts';
import { contestService } from './services/contestService.ts';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn('MONGODB_URI is not defined in environment variables.');
      return;
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('Connected to MongoDB');

    // Seed achievements
    achievementService.seedAchievements().catch(err => console.error('Failed to seed achievements:', err));
    // Seed problems
    problemService.seedProblems().catch(err => console.error('Failed to seed problems:', err));

    // Periodic contest status check (only if not in serverless env)
    if (process.env.NETLIFY !== 'true') {
      setInterval(() => {
        contestService.checkStatusChanges().catch(err => console.error('Contest status check failed:', err));
      }, 60000);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Do not throw error so the server can still start
  }
}
