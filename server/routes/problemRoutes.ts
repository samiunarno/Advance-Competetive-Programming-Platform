import express from 'express';
import { getAllProblems, getProblemById, createProblem, updateProblem, deleteProblem } from '../controllers/problemController.ts';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', optionalAuthenticate, getAllProblems);
router.get('/:id', optionalAuthenticate, getProblemById);
router.post('/', authenticate, authorize(['admin']), createProblem);
router.put('/:id', authenticate, authorize(['admin']), updateProblem);
router.delete('/:id', authenticate, authorize(['admin']), deleteProblem);

export default router;
