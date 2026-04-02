const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for backward compatibility with existing guest blogs
  },
  topic: { type: String, required: true },
  mode: { type: String, enum: ['closed_book', 'hybrid', 'open_book'], default: 'hybrid' },
  llmProvider: { type: String, default: 'groq' },
  llmModel: { type: String, default: '' },
  plan: { type: Object, default: null },
  sections: { type: Array, default: [] },
  finalMarkdown: { type: String, default: '' },
  imageSpecs: { type: Array, default: [] },
  wordCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

blogSchema.index({ createdAt: -1 });
blogSchema.index({ topic: 'text' });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
