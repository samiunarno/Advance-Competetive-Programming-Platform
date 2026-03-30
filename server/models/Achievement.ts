import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // Lucide icon name
  criteria: {
    type: { type: String, enum: ['submissions', 'accepted', 'streak', 'contest_rank'], required: true },
    value: { type: Number, required: true }
  },
  created_at: { type: Date, default: Date.now }
});

export const Achievement = mongoose.model('Achievement', achievementSchema);

const userAchievementSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievement_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
  earned_at: { type: Date, default: Date.now }
});

export const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
