import { Submission } from '../models/Submission.ts';
import { contestService } from './contestService.ts';
import { broadcastGlobal } from '../websocket.ts';
import { achievementService } from './achievementService.ts';
import { User } from '../models/User.ts';

export class SubmissionService {
  async getSubmissions(userId: string) {
    return await Submission.find({ user_id: userId })
      .populate('problem_id', 'title')
      .sort({ created_at: -1 });
  }

  async createSubmission(data: any, userId: string) {
    const { problem_id, code, language, verdict, execution_output, execution_time, memory_usage } = data;

    const submission = new Submission({
      user_id: userId,
      problem_id,
      code,
      language,
      verdict: verdict || 'Pending',
      execution_output,
      execution_time: execution_time || 0,
      memory_usage: memory_usage || 0,
    });

    await submission.save();
    const populatedSubmission = await Submission.findById(submission._id).populate('problem_id', 'title');
    const user = await User.findById(userId);

    // Broadcast to global feed
    if (user) {
      broadcastGlobal('global_activity', {
        type: 'submission',
        user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar
        },
        details: {
          problemTitle: (populatedSubmission?.problem_id as any)?.title,
          problemId: problem_id,
          verdict: verdict
        }
      });
    }

    // Check achievements
    achievementService.checkAchievements(userId).catch(err => console.error('Achievement check failed:', err));

    // Check if this submission is part of an active contest
    try {
      const activeContest = await contestService.getActiveContestByProblemId(problem_id);
      if (activeContest) {
        await contestService.broadcastLeaderboardUpdate(activeContest._id.toString());
      }
    } catch (error) {
      console.error('Failed to broadcast contest update', error);
    }

    return submission;
  }
}

export const submissionService = new SubmissionService();
