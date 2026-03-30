import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  input_format: { type: String, required: true },
  output_format: { type: String, required: true },
  sample_input: { type: String, required: true },
  sample_output: { type: String, required: true },
  tags: [{ type: String }],
  supported_languages: [{ type: String }],
  start_time: { type: Date },
  deadline: { type: Date },
  daily_limit: { type: Number },
  points: { type: Number, default: 100 },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Problem = mongoose.model('Problem', problemSchema);
