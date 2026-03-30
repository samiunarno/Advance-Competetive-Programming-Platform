import { Request, Response } from 'express';
import { submissionService } from '../services/submissionService.ts';

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const submissions = await submissionService.getSubmissions(userId);
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
};

export const createSubmission = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const submission = await submissionService.createSubmission(req.body, userId);
    res.status(201).json(submission);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create submission', error: error.message });
  }
};
