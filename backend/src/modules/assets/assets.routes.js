const express = require('express');
const router = express.Router();
const { getAssets, getCategories, createAsset } = require('./controllers/assetsController');

// GET /api/assets/categories  — must be before /api/assets/:id
router.get('/categories', getCategories);

// GET /api/assets
router.get('/', getAssets);

// POST /api/assets
router.post('/', createAsset);

module.exports = router;
