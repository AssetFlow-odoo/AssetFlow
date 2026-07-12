const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedToDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expectedReturnDate: { type: Date },
  actualReturnDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Active', 'Returned', 'TransferPending'],
    default: 'Active'
  },
  checkInNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Allocation', allocationSchema);