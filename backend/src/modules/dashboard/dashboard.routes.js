const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('./dashboard.controller');
// const { protect } = require('../../middleware/auth'); // Assuming there's auth middleware, but we will keep it simple for now or use the existing one

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

module.exports = router;
