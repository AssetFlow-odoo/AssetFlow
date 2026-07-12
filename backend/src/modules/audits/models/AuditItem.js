const mongoose = require('mongoose');

const auditCycleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  scope: {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    location: { type: String }
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: ['Open', 'Closed'],
    default: 'Open'
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditCycle', auditCycleSchema);