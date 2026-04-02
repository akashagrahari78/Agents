const express = require('express');
const { protect } = require('../middleware/authMiddleware.js');
const { generateBlog } = require('../controllers/generateController.js');

const router = express.Router();

router.post('/', protect, generateBlog);

module.exports = router;
