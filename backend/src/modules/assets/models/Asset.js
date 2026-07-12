const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', required: true },
  serialNumber: { type: String },
  acquisitionDate: { type: Date },
  acquisitionCost: { type: Number },
  condition: { type: String },
  location: { type: String },
  isSharedBookable: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
    default: 'Available'
  },
  dynamicAttributes: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  photoUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);