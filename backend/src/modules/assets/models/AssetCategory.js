const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  customFields: [{
    fieldName: { type: String, required: true },
    fieldType: { type: String, enum: ['String', 'Number', 'Boolean', 'Date'], required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('AssetCategory', assetCategorySchema);