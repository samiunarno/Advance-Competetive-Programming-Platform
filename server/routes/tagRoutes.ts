import express from 'express';
import { tagService } from '../services/tagService.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = express.Router();

// Public routes
router.get('/', async (req, res) => {
  try {
    const tags = await tagService.getAll();
    res.json(tags);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const tag = await tagService.create(req.body);
    res.status(201).json(tag);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const tag = await tagService.update(req.params.id, req.body);
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json(tag);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const tag = await tagService.delete(req.params.id);
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json({ message: 'Tag deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
