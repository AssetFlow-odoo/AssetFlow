const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Should be hashed
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  role: { 
    type: String, 
    enum: ['Admin', 'Asset Manager', 'Department Head', 'Employee'], 
    default: 'Employee' 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);