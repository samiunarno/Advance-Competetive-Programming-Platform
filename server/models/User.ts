import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  is_banned: { type: Boolean, default: false },
  ban_reason: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  github_url: { type: String, default: '' },
  linkedin_url: { type: String, default: '' },
  website_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
