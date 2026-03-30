import mongoose from 'mongoose';
import { Contest } from '../models/Contest.ts';
import { User } from '../models/User.ts';
import { Submission } from '../models/Submission.ts';
import { Problem } from '../models/Problem.ts';
import { broadcastContestUpdate, broadcastGlobal } from '../websocket.ts';

export class ContestService {
  async getAllContests(userId?: string) {
    const contests = await Contest.find().sort({ start_time: -1 });
    const now = new Date();

    return contests.map(contest => {
      const contestObj = contest.toObject();
      const startTime = new Date(contest.start_time);
      const endTime = new Date(contest.end_time);

      let status: 'upcoming' | 'active' | 'ended' = 'upcoming';
      if (now > endTime) {
        status = 'ended';
      } else if (now >= startTime) {
        status = 'active';
      }

      return {
        ...contestObj,
        id: contest._id.toString(),
        status,
        participant_count: contest.participants.length,
        is_registered: userId ? contest.participants.some(p => p.toString() === userId) : false
      };
    });
  }

  async getContestById(id: string, userId?: string) {
    const contest = await Contest.findById(id).populate('problems');
    if (!contest) {
      throw new Error('Contest not found');
    }

    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);

    let status: 'upcoming' | 'active' | 'ended' = 'upcoming';
    if (now > endTime) {
      status = 'ended';
    } else if (now >= startTime) {
      status = 'active';
    }

    return {
      ...contest.toObject(),
      id: contest._id.toString(),
      status,
      participant_count: contest.participants.length,
      is_registered: userId ? contest.participants.some(p => p.toString() === userId) : false
    };
  }

  async createContest(data: any, userId: string) {
    const contest = new Contest({ ...data, created_by: userId });
    await contest.save();
    broadcastGlobal('new_contest', contest);
    return contest;
  }

  async updateContest(id: string, data: any) {
    const contest = await Contest.findByIdAndUpdate(id, data, { new: true }).populate('problems');
    if (!contest) {
      throw new Error('Contest not found');
    }
    broadcastContestUpdate(id, 'contest_update', contest);
    return contest;
  }

  async deleteContest(id: string) {
    const contest = await Contest.findByIdAndDelete(id);
    if (!contest) {
      throw new Error('Contest not found');
    }
    return contest;
  }

  async register(contestId: string, userId: string) {
    const contest = await Contest.findById(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }
    
    // Check if user is already registered
    if (contest.participants.some(p => p.toString() === userId)) {
      throw new Error('User already registered');
    }

    contest.participants.push(userId as any);
    await contest.save();
    return contest;
  }

  async getActiveContestByProblemId(problemId: string) {
    const now = new Date();
    return await Contest.findOne({
      problems: problemId,
      start_time: { $lte: now },
      end_time: { $gte: now }
    });
  }

  async broadcastLeaderboardUpdate(contestId: string) {
    const leaderboard = await this.getLeaderboard(contestId);
    broadcastContestUpdate(contestId, 'leaderboard_update', leaderboard);
  }

  async checkStatusChanges() {
    const now = new Date();
    const contests = await Contest.find();
    for (const contest of contests) {
      const startTime = new Date(contest.start_time);
      const endTime = new Date(contest.end_time);
      
      // Check if status should change
      // This is a simplified check. A better way would be to store the current status in DB
      // and only broadcast if it changes.
      
      // For now, we'll broadcast a general 'contest_status_update' every minute
      // which triggers a refresh on the frontend.
    }
    broadcastGlobal('contest_status_update', {});
  }

  async getLeaderboard(contestId: string) {
    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      throw new Error('Invalid contest ID');
    }
    const contest = await Contest.findById(contestId).populate('problems');
    if (!contest) {
      throw new Error('Contest not found');
    }

    // Get all submissions for this contest's problems within the time range
    const submissions = await Submission.find({
      contest_id: contestId,
      user_id: { $in: contest.participants },
      verdict: 'Accepted'
    }).populate('user_id', 'username avatar');

    // Group by user
    const userStats: Record<string, { 
      username: string, 
      avatar?: string, 
      score: number, 
      solved_problems: Set<string>,
      finish_time: Date
    }> = {};

    // Calculate scores
    for (const sub of submissions) {
      const userId = (sub.user_id as any)._id.toString();
      const problemId = sub.problem_id.toString();
      
      // Find the problem in the contest to get its points
      const problem = contest.problems.find((p: any) => p._id.toString() === problemId) as any;
      const points = problem?.points || 100;
      
      if (!userStats[userId]) {
        userStats[userId] = {
          username: (sub.user_id as any).username,
          avatar: (sub.user_id as any).avatar,
          score: 0,
          solved_problems: new Set(),
          finish_time: sub.created_at
        };
      }

      // Only count unique solved problems
      if (!userStats[userId].solved_problems.has(problemId)) {
        userStats[userId].solved_problems.add(problemId);
        userStats[userId].score += points;
        
        // Update finish time to the latest submission time
        if (sub.created_at > userStats[userId].finish_time) {
          userStats[userId].finish_time = sub.created_at;
        }
      }
    }

    // Convert to array and sort
    const leaderboard = Object.values(userStats).map(stat => {
      // Calculate duration string
      const startTime = new Date(contest.start_time).getTime();
      const finishTime = new Date(stat.finish_time).getTime();
      const durationMs = finishTime - startTime;
      
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      
      return {
        username: stat.username,
        avatar: stat.avatar,
        score: stat.score,
        solved_count: stat.solved_problems.size,
        solved_problem_ids: Array.from(stat.solved_problems),
        finish_time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        raw_finish_time: durationMs // for sorting
      };
    });

    // Sort by score (desc) then finish time (asc)
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.raw_finish_time - b.raw_finish_time;
    });

    // Add rank
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      score: entry.score,
      solved_count: entry.solved_count,
      solved_problem_ids: entry.solved_problem_ids,
      finish_time: entry.finish_time,
      avatar: entry.avatar
    }));
  }
}

export const contestService = new ContestService();
