const express = require('express');
const { protect } = require('../middleware/authMiddleware.js');
const { generateBlog, reviewPlan } = require('../controllers/generateController.js');

const router = express.Router();

router.post('/', protect, generateBlog);
router.post('/review', protect, reviewPlan);

module.exports = router;
