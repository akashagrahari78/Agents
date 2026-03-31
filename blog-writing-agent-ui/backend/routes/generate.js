import express from 'express';
import Blog from '../models/Blog.js';
import { runAgent } from '../services/agentRunner.js';

const router = express.Router();

// POST /api/generate — triggers the LangGraph agent, streams progress via SSE
router.post('/', async (req, res) => {
  const { topic, mode, audience, tone, targetWordCount, includeCode, includeCitations, includeImages } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  let userId = null;
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      userId = decoded.id;
    } catch(e) { }
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendSSE = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await runAgent(
      { topic, mode, audience, tone, targetWordCount, includeCode, includeCitations, includeImages },
      (stepIndex, status) => {
        sendSSE({ type: 'step', stepIndex, status });
      }
    );

    // Save to MongoDB
    const blog = new Blog({
      user: userId,
      topic,
      mode: result.mode || mode || 'hybrid',
      plan: result.plan,
      sections: result.sections,
      finalMarkdown: result.finalMarkdown,
      imageSpecs: result.imageSpecs || [],
      wordCount: result.wordCount || 0,
    });

    await blog.save();

    // Send the complete result
    sendSSE({
      type: 'complete',
      blog: {
        _id: blog._id,
        topic: blog.topic,
        mode: blog.mode,
        plan: blog.plan,
        sections: blog.sections,
        finalMarkdown: blog.finalMarkdown,
        imageSpecs: blog.imageSpecs,
        wordCount: blog.wordCount,
        createdAt: blog.createdAt,
      },
    });
  } catch (err) {
    console.error('Generation error:', err);
    sendSSE({ type: 'error', message: err.message || 'Generation failed' });
  } finally {
    res.end();
  }
});

export default router;
