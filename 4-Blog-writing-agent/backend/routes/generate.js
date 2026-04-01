const express = require('express');
const { optionalAuth } = require('../middleware/authMiddleware.js');
const { generateBlog } = require('../controllers/generateController.js');

const router = express.Router();

router.post('/', optionalAuth, generateBlog);

module.exports = router;
