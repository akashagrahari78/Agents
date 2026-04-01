const mongoose = require('mongoose');

const Blog = require('../models/Blog.js');
const { runAgent } = require('../services/agentRunner.js');

async function generateBlog(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const topic = req.body?.topic?.trim();
    if (!topic) {
      sendEvent({ type: 'error', message: 'Topic is required' });
      return;
    }

    const result = await runAgent(req.body, (stepIndex, status) => {
      sendEvent({ type: 'step', stepIndex, status });
    });

    let savedBlog = null;
    if (mongoose.connection.readyState === 1 && req.user?.id) {
      savedBlog = await Blog.create({
        user: req.user.id,
        topic,
        mode: result.mode || req.body.mode || 'hybrid',
        plan: result.plan,
        sections: result.sections,
        finalMarkdown: result.finalMarkdown,
        imageSpecs: result.imageSpecs || [],
        wordCount: result.wordCount || 0,
      });
    }

    sendEvent({
      type: 'complete',
      blog: savedBlog
        ? savedBlog.toObject()
        : {
            ...result,
            topic,
            _id: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
    });
  } catch (error) {
    sendEvent({ type: 'error', message: error.message || 'Generation failed' });
  } finally {
    res.end();
  }
}

module.exports = {
  generateBlog,
};
