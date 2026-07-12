const express = require('express');
const router = express.Router();
const { getAssets, getCategories, createAsset } = require('./controllers/assetsController');
const authGuard = require('../../middleware/authGuard');

// GET /api/assets/categories  — must be before /api/assets/:id
router.get('/categories', getCategories);

// GET /api/assets
router.get('/', getAssets);

// POST /api/assets
router.post('/', authGuard, createAsset);

module.exports = router;
