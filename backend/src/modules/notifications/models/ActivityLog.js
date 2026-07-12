const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { type: String, required: true },
  message: { type: String, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // Flexible ref for Asset/Booking/Ticket
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);