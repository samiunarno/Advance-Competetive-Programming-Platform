import { Achievement, UserAchievement } from '../models/Achievement.ts';
import { Submission } from '../models/Submission.ts';
import { User } from '../models/User.ts';
import { broadcastGlobal } from '../websocket.ts';

export class AchievementService {
  async checkAchievements(userId: string) {
    const achievements = await Achievement.find();
    const userAchievements = await UserAchievement.find({ user_id: userId });
    const earnedIds = userAchievements.map(ua => ua.achievement_id.toString());

    const totalSubmissions = await Submission.countDocuments({ user_id: userId });
    const acceptedSubmissions = await Submission.countDocuments({ user_id: userId, verdict: 'Accepted' });
    
    // Calculate streak
    const userSubmissions = await Submission.find({ user_id: userId })
      .sort({ created_at: -1 })
      .select('created_at');
    
    let streak = 0;
    if (userSubmissions.length > 0) {
      const dates = new Set(userSubmissions.map(s => s.created_at.toISOString().split('T')[0]));
      const sortedDates = Array.from(dates).sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const d1 = new Date(sortedDates[i]);
          const d2 = new Date(sortedDates[i+1]);
          const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) streak++;
          else break;
        }
      }
    }

    const stats = {
      submissions: totalSubmissions,
      accepted: acceptedSubmissions,
      streak: streak,
      contest_rank: 0 // Still need a way to track best contest rank
    };

    for (const achievement of achievements) {
      if (earnedIds.includes(achievement._id.toString())) continue;

      let earned = false;
      const { type, value } = achievement.criteria;

      if (type === 'submissions' && stats.submissions >= value) earned = true;
      if (type === 'accepted' && stats.accepted >= value) earned = true;
      if (type === 'streak' && stats.streak >= value) earned = true;
      // Add other criteria checks here

      if (earned) {
        const newEarned = new UserAchievement({
          user_id: userId,
          achievement_id: achievement._id
        });
        await newEarned.save();

        // Broadcast to global feed
        const user = await User.findById(userId);
        if (user) {
          broadcastGlobal('global_activity', {
            type: 'achievement',
            user: {
              id: user._id,
              username: user.username,
              avatar: user.avatar
            },
            details: {
              achievementName: achievement.name,
              achievementIcon: achievement.icon,
              achievementDescription: achievement.description
            }
          });
        }
      }
    }
  }

  async seedAchievements() {
    const defaultAchievements = [
      { name: 'First Step', description: 'Make your first submission', icon: 'Zap', criteria: { type: 'submissions', value: 1 } },
      { name: 'Problem Solver', description: 'Solve 5 problems', icon: 'CheckCircle', criteria: { type: 'accepted', value: 5 } },
      { name: 'Code Master', description: 'Solve 25 problems', icon: 'Trophy', criteria: { type: 'accepted', value: 25 } },
      { name: 'Consistent', description: 'Maintain a 3-day streak', icon: 'Flame', criteria: { type: 'streak', value: 3 } },
      { name: 'Unstoppable', description: 'Maintain a 7-day streak', icon: 'Zap', criteria: { type: 'streak', value: 7 } },
    ];

    for (const ach of defaultAchievements) {
      await Achievement.findOneAndUpdate({ name: ach.name }, ach, { upsert: true });
    }
  }
}

export const achievementService = new AchievementService();
