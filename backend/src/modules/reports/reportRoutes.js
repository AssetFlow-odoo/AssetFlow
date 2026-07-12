const express = require('express');
const router = express.Router();
const { getDashboardData, exportData } = require('./reportController');
const authGuard = require('../../middleware/authGuard');

router.use(authGuard);

router.get('/dashboard', getDashboardData);
router.get('/export', exportData);

module.exports = router;
