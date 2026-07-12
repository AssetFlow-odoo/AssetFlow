const express = require('express');
const router = express.Router();
const { getAssets } = require('../controllers/assetController');
const authGuard = require('../../../middleware/authGuard');

router.use(authGuard);
router.get('/', getAssets);

module.exports = router;
