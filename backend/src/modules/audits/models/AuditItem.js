const mongoose = require('mongoose');

const auditItemSchema = new mongoose.Schema({
  auditCycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  
  // Snapshots taken when cycle is created
  expectedLocation: { type: String },
  expectedDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  expectedStatus: { type: String },

  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Missing', 'Damaged'],
    default: 'Pending'
  },
  auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditItem', auditItemSchema);