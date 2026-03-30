import { Request, Response } from 'express';
import { problemService } from '../services/problemService.ts';

export const getAllProblems = async (req: Request, res: Response) => {
  try {
    const isAdmin = (req as any).user?.role === 'admin';
    const problems = await problemService.getAllProblems(req.query, isAdmin);
    res.json(problems);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch problems', error: error.message });
  }
};

export const getProblemById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const isAdmin = (req as any).user?.role === 'admin';
    const problem = await problemService.getProblemById(req.params.id, userId, isAdmin);
    res.json(problem);
  } catch (error: any) {
    if (error.message === 'Problem not found') {
      res.status(404).json({ message: 'Problem not found' });
    } else {
      res.status(500).json({ message: 'Failed to fetch problem', error: error.message });
    }
  }
};

export const createProblem = async (req: Request, res: Response) => {
  try {
    const problem = await problemService.createProblem(req.body, (req as any).user.id);
    res.status(201).json(problem);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create problem', error: error.message });
  }
};

export const updateProblem = async (req: Request, res: Response) => {
  try {
    const problem = await problemService.updateProblem(req.params.id, req.body);
    res.json(problem);
  } catch (error: any) {
    if (error.message === 'Problem not found') {
      res.status(404).json({ message: 'Problem not found' });
    } else {
      res.status(500).json({ message: 'Failed to update problem', error: error.message });
    }
  }
};

export const deleteProblem = async (req: Request, res: Response) => {
  try {
    await problemService.deleteProblem(req.params.id);
    res.json({ message: 'Problem deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Problem not found') {
      res.status(404).json({ message: 'Problem not found' });
    } else {
      res.status(500).json({ message: 'Failed to delete problem', error: error.message });
    }
  }
};
