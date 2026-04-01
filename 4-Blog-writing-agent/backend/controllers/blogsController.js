const Blog = require('../models/Blog.js');

async function getBlogs(req, res) {
  try {
    const blogs = await Blog.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(blogs);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch blogs' });
  }
}

async function getBlogById(req, res) {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    return res.json(blog);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch blog' });
  }
}

async function updateBlog(req, res) {
  try {
    const allowedFields = ['topic', 'mode', 'plan', 'sections', 'finalMarkdown', 'imageSpecs', 'wordCount'];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    return res.json(blog);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update blog' });
  }
}

async function deleteBlog(req, res) {
  try {
    const deleted = await Blog.findOneAndDelete({ _id: req.params.id, user: req.user.id }).lean();
    if (!deleted) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete blog' });
  }
}

module.exports = {
  deleteBlog,
  getBlogById,
  getBlogs,
  updateBlog,
};
