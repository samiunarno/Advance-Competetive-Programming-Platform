import { Problem } from '../models/Problem.ts';
import { Submission } from '../models/Submission.ts';
import { broadcastGlobal } from '../websocket.ts';

export class ProblemService {
  async getAllProblems(query: any, isAdmin: boolean = false) {
    const { difficulty, search, sort } = query;
    let filter: any = {};

    if (!isAdmin) {
      filter.visibility = 'public';
    }

    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    let sortOption: any = { created_at: -1 };
    if (sort === 'Difficulty') {
      sortOption = { difficulty: 1 };
    }

    return await Problem.find(filter).sort(sortOption).populate('created_by', 'username');
  }

  async getProblemById(id: string, userId?: string) {
    const problem = await Problem.findById(id).populate('created_by', 'username');
    if (!problem) {
      throw new Error('Problem not found');
    }

    let userSubmissionCount = 0;
    if (userId) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      userSubmissionCount = await Submission.countDocuments({
        user_id: userId,
        problem_id: id,
        created_at: { $gte: startOfDay }
      });
    }

    return { ...problem.toObject(), user_daily_submissions: userSubmissionCount };
  }

  async createProblem(data: any, userId: string) {
    const problem = new Problem({ ...data, created_by: userId });
    await problem.save();
    broadcastGlobal('new_problem', problem);
    return problem;
  }

  async updateProblem(id: string, data: any) {
    const problem = await Problem.findByIdAndUpdate(id, data, { new: true });
    if (!problem) {
      throw new Error('Problem not found');
    }
    return problem;
  }

  async deleteProblem(id: string) {
    const problem = await Problem.findByIdAndDelete(id);
    if (!problem) {
      throw new Error('Problem not found');
    }
    broadcastGlobal('problem_deleted', { id });
    return problem;
  }

  async seedProblems() {
    const count = await Problem.countDocuments();
    if (count > 0) return;

    const initialProblems = [
      {
        title: "Two Sum",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        difficulty: "Easy",
        category: "Arrays",
        input_format: "An array of integers and a target integer.",
        output_format: "Indices of the two numbers.",
        sample_input: "nums = [2,7,11,15], target = 9",
        sample_output: "[0,1]",
        tags: ["Array", "Hash Table"],
        visibility: "public"
      },
      {
        title: "Reverse Integer",
        description: "Given a signed 32-bit integer `x`, return `x` with its digits reversed. If reversing `x` causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.",
        difficulty: "Medium",
        category: "Math",
        input_format: "A signed 32-bit integer.",
        output_format: "The reversed integer.",
        sample_input: "123",
        sample_output: "321",
        tags: ["Math"],
        visibility: "public"
      }
    ];

    for (const p of initialProblems) {
      await new Problem(p).save();
    }
    console.log('Seeded initial problems');
  }
}

export const problemService = new ProblemService();
