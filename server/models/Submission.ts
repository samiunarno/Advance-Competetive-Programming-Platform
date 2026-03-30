import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  contest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
  code: { type: String, required: true },
  language: { type: String, required: true },
  verdict: { type: String, enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'], default: 'Pending' },
  execution_time: { type: Number },
  memory_usage: { type: Number },
  execution_output: { type: String },
  created_at: { type: Date, default: Date.now },
});

export const Submission = mongoose.model('Submission', submissionSchema);
