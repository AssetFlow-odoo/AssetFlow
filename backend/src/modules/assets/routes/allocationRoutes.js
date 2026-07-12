const express = require('express');
const router = express.Router();
const { requestAllocation, getPendingQueue, getRecentAllocations, approveRequest, rejectRequest } = require('../controllers/allocationController');
const authGuard = require('../../../middleware/authGuard');

// Require auth for all allocation routes
router.use(authGuard);

router.post('/request', requestAllocation);
router.get('/pending', getPendingQueue);
router.get('/recent', getRecentAllocations);
router.put('/:id/approve', approveRequest);
router.put('/:id/reject', rejectRequest);

module.exports = router;
