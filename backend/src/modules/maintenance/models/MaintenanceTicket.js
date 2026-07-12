const mongoose = require('mongoose');

const maintenanceTicketSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDescription: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  photoUrl: { type: String },
  assignedTechnicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  externalTechnicianName: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);