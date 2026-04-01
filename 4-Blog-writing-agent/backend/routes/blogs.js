const express = require('express');

const {
  deleteBlog,
  getBlogById,
  getBlogs,
  updateBlog,
} = require('../controllers/blogsController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.use(protect);

router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.patch('/:id', updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;
