const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('./notificationController');
const authGuard = require('../../middleware/authGuard');

router.use(authGuard);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;
