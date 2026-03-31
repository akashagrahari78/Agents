import express from 'express';
import Blog from '../models/Blog.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/blogs — list all blogs for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const blogs = await Blog.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/blogs/:id — single blog
router.get('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/blogs/:id — delete
router.delete('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
