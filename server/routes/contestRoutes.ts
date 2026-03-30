import express from 'express';
import { 
  getContests, 
  getContestById, 
  registerContest, 
  getLeaderboard,
  createContest,
  updateContest,
  deleteContest
} from '../controllers/contestController.ts';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', optionalAuthenticate, getContests);
router.get('/:id', optionalAuthenticate, getContestById);
router.post('/:id/register', authenticate, registerContest);
router.get('/:id/leaderboard', authenticate, getLeaderboard);

// Admin routes
router.post('/', authenticate, authorize(['admin']), createContest);
router.put('/:id', authenticate, authorize(['admin']), updateContest);
router.delete('/:id', authenticate, authorize(['admin']), deleteContest);

export default router;
