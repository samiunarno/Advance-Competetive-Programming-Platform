import { User } from '../models/User.ts';
import { Submission } from '../models/Submission.ts';
import mongoose from 'mongoose';

import bcrypt from 'bcryptjs';

import { UserAchievement } from '../models/Achievement.ts';

export class UserService {
  async createUser(data: any) {
    const { username, email, password, role } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    return user;
  }

  async getAllUsers() {
    const users = await User.find().select('-password');
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const total_submissions = await Submission.countDocuments({ user_id: user._id });
      return { ...user.toObject(), total_submissions };
    }));
    return usersWithStats;
  }

  async getUserById(id: string) {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id: string, data: any) {
    const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async banUser(id: string, reason: string = 'Violation of terms') {
    const user = await User.findByIdAndUpdate(id, { is_banned: true, ban_reason: reason }, { new: true }).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async unbanUser(id: string) {
    const user = await User.findByIdAndUpdate(id, { is_banned: false }, { new: true }).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async deleteUser(id: string) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserStats(userId: string) {
    const totalSubmissions = await Submission.countDocuments({ user_id: userId });
    const acceptedSubmissions = await Submission.countDocuments({ user_id: userId, verdict: 'Accepted' });
    
    // Calculate rank (based on accepted submissions)
    const allUsersStats = await Submission.aggregate([
      { $match: { verdict: 'Accepted' } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const userRankIndex = allUsersStats.findIndex(stat => stat._id.toString() === userId);
    const rank = userRankIndex === -1 ? allUsersStats.length + 1 : userRankIndex + 1;

    // Calculate streak
    const userSubmissions = await Submission.find({ user_id: userId })
      .sort({ created_at: -1 })
      .select('created_at');
    
    let currentStreak = 0;
    if (userSubmissions.length > 0) {
      const dates = new Set(userSubmissions.map(s => s.created_at.toISOString().split('T')[0]));
      const sortedDates = Array.from(dates).sort().reverse();
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const d1 = new Date(sortedDates[i]);
          const d2 = new Date(sortedDates[i+1]);
          const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    const recentActivity = await Submission.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(5)
      .populate('problem_id', 'title');

    // Heatmap data: submissions per day for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const heatmapData = await Submission.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Radar data: accepted submissions per tag
    const radarData = await Submission.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId), verdict: 'Accepted' } },
      { $lookup: {
          from: 'problems',
          localField: 'problem_id',
          foreignField: '_id',
          as: 'problem'
      }},
      { $unwind: '$problem' },
      { $unwind: '$problem.tags' },
      { $group: {
          _id: '$problem.tags',
          count: { $sum: 1 }
      }},
      { $project: { subject: '$_id', A: '$count', fullMark: 10 } }
    ]);

    // If no radar data, provide some defaults for the chart
    const finalRadarData = radarData.length > 0 ? radarData : [
      { subject: 'Math', A: 0, fullMark: 10 },
      { subject: 'DP', A: 0, fullMark: 10 },
      { subject: 'Graphs', A: 0, fullMark: 10 },
      { subject: 'Strings', A: 0, fullMark: 10 },
      { subject: 'Greedy', A: 0, fullMark: 10 },
    ];

    const achievements = await UserAchievement.find({ user_id: userId })
      .populate('achievement_id');

    return {
      totalSubmissions,
      acceptedSubmissions,
      currentStreak,
      rank,
      recentActivity,
      heatmapData,
      radarData: finalRadarData,
      achievements
    };
  }
}

export const userService = new UserService();
