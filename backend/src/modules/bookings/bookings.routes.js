const express = require('express');
const router = express.Router();
const {
  getBookableResources,
  getBookings,
  createBooking,
  cancelBooking,
  rescheduleBooking
} = require('./bookings.controller');

const authGuard = require('../../middleware/authGuard');

router.use(authGuard);

// GET /api/bookings/resources — list all bookable assets
router.get('/resources', getBookableResources);

// GET /api/bookings?assetId=...&date=YYYY-MM-DD
router.get('/', getBookings);

// POST /api/bookings
router.post('/', createBooking);

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', cancelBooking);

// PATCH /api/bookings/:id/reschedule
router.patch('/:id/reschedule', rescheduleBooking);

module.exports = router;
