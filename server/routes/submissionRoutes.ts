import express from 'express';
import { getSubmissions, createSubmission } from '../controllers/submissionController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', authenticate, getSubmissions);
router.post('/', authenticate, createSubmission);

export default router;
