import { Request, Response } from 'express';
import { contestService } from '../services/contestService.ts';

export const getContests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const contests = await contestService.getAllContests(userId);
    res.json(contests);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch contests', error: error.message });
  }
};

export const getContestById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const contest = await contestService.getContestById(req.params.id, userId);
    res.json(contest);
  } catch (error: any) {
    if (error.message === 'Contest not found') {
      res.status(404).json({ message: 'Contest not found' });
    } else {
      res.status(500).json({ message: 'Failed to fetch contest', error: error.message });
    }
  }
};

export const createContest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const contest = await contestService.createContest(req.body, userId);
    res.status(201).json(contest);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create contest', error: error.message });
  }
};

export const updateContest = async (req: Request, res: Response) => {
  try {
    const contest = await contestService.updateContest(req.params.id, req.body);
    res.json(contest);
  } catch (error: any) {
    if (error.message === 'Contest not found') {
      res.status(404).json({ message: 'Contest not found' });
    } else {
      res.status(500).json({ message: 'Failed to update contest', error: error.message });
    }
  }
};

export const deleteContest = async (req: Request, res: Response) => {
  try {
    await contestService.deleteContest(req.params.id);
    res.json({ message: 'Contest deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Contest not found') {
      res.status(404).json({ message: 'Contest not found' });
    } else {
      res.status(500).json({ message: 'Failed to delete contest', error: error.message });
    }
  }
};

export const registerContest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await contestService.register(req.params.id, userId);
    res.json({ message: 'Registered successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to register', error: error.message });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await contestService.getLeaderboard(req.params.id);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
};
