const Booking = require('./models/Booking');
const Asset = require('../assets/models/Asset');

// Add a "purpose" field to bookings for display
// The model has: assetId, bookedBy, startTime, endTime, status

// GET /api/bookings/resources — Get all bookable (shared) assets
exports.getBookableResources = async (req, res) => {
  try {
    const resources = await Asset.find({ isSharedBookable: true })
      .populate('categoryId', 'name')
      .sort({ name: 1 });
    res.json({ success: true, data: resources });
  } catch (err) {
    console.error('Error fetching bookable resources:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/bookings?assetId=...&date=YYYY-MM-DD — Get bookings for a resource on a date
exports.getBookings = async (req, res) => {
  try {
    const { assetId, date } = req.query;
    if (!assetId) return res.status(400).json({ success: false, message: 'assetId is required' });

    let query = { assetId };

    // If a date is given, filter to that day; otherwise return all
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.startTime = { $lt: dayEnd };
      query.endTime = { $gt: dayStart };
    }

    const bookings = await Booking.find(query)
      .populate('bookedBy', 'name email')
      .populate('assetId', 'name assetTag')
      .sort({ startTime: 1 });

    // Auto-update statuses based on current time
    const now = new Date();
    for (const b of bookings) {
      let newStatus = b.status;
      if (b.status === 'Cancelled') continue;
      if (now >= b.endTime) newStatus = 'Completed';
      else if (now >= b.startTime && now < b.endTime) newStatus = 'Ongoing';
      else newStatus = 'Upcoming';

      if (newStatus !== b.status) {
        b.status = newStatus;
        await b.save();
      }
    }

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/bookings — Create a booking with overlap validation
exports.createBooking = async (req, res) => {
  try {
    const { assetId, startTime, endTime, purpose } = req.body;

    if (!assetId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'assetId, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Check asset is bookable
    const asset = await Asset.findById(assetId);
    if (!asset || !asset.isSharedBookable) {
      return res.status(400).json({ success: false, message: 'This asset is not a bookable resource' });
    }

    // Overlap check: existing booking overlaps if its start < requested end AND its end > requested start
    // Edge case: back-to-back is fine (existing 9-10, new 10-11 → no overlap)
    const overlap = await Booking.findOne({
      assetId,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlap) {
      const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return res.status(409).json({
        success: false,
        message: `Conflict: slot ${fmtTime(overlap.startTime)}–${fmtTime(overlap.endTime)} is already booked`,
        conflict: overlap
      });
    }

    // Get bookedBy from token if available, else from body
    let bookedBy = req.body.bookedBy;
    if (!bookedBy) {
      // Try to extract from Authorization header
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
          bookedBy = decoded.id || decoded.userId;
        } catch (e) { /* ignore */ }
      }
    }

    if (!bookedBy) {
      return res.status(400).json({ success: false, message: 'bookedBy (user ID) is required' });
    }

    const booking = new Booking({
      assetId,
      bookedBy,
      startTime: start,
      endTime: end,
      status: 'Upcoming'
    });

    await booking.save();
    const populated = await booking.populate([
      { path: 'bookedBy', select: 'name email' },
      { path: 'assetId', select: 'name assetTag' }
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/bookings/:id/cancel — Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    const populated = await booking.populate([
      { path: 'bookedBy', select: 'name email' },
      { path: 'assetId', select: 'name assetTag' }
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/bookings/:id/reschedule — Reschedule a booking
exports.rescheduleBooking = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: `Cannot reschedule a ${booking.status.toLowerCase()} booking` });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Check overlap (excluding this booking itself)
    const overlap = await Booking.findOne({
      assetId: booking.assetId,
      _id: { $ne: booking._id },
      status: { $ne: 'Cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlap) {
      const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return res.status(409).json({
        success: false,
        message: `Conflict: slot ${fmtTime(overlap.startTime)}–${fmtTime(overlap.endTime)} is already booked`,
        conflict: overlap
      });
    }

    booking.startTime = start;
    booking.endTime = end;
    booking.status = 'Upcoming';
    await booking.save();

    const populated = await booking.populate([
      { path: 'bookedBy', select: 'name email' },
      { path: 'assetId', select: 'name assetTag' }
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('Error rescheduling booking:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
