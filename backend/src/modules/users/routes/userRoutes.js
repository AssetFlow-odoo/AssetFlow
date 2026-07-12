const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/userController');

router.route('/')
  .get(getUsers);

router.route('/:id/role')
  .put(updateUserRole);

module.exports = router;
