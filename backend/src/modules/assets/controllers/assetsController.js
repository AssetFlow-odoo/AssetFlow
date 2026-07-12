const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');

// GET /api/assets
exports.getAssets = async (req, res) => {
  try {
    const { search, categoryId, status } = req.query;
    let query = {};

    // Apply search filter (tag, serial, or name)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { assetTag: searchRegex },
        { serialNumber: searchRegex },
        { name: searchRegex }
      ];
    }

    // Apply category filter
    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    const assets = await Asset.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, message: 'Server error fetching assets' });
  }
};

// GET /api/assets/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await AssetCategory.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

// POST /api/assets — Register a new asset
exports.createAsset = async (req, res) => {
  try {
    const {
      assetTag, name, categoryId, serialNumber, acquisitionDate,
      acquisitionCost, condition, location, isSharedBookable, status
    } = req.body;

    // Check duplicate tag
    const existing = await Asset.findOne({ assetTag });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Asset tag already exists' });
    }

    const asset = new Asset({
      assetTag, name, categoryId, serialNumber, acquisitionDate,
      acquisitionCost, condition, location,
      isSharedBookable: isSharedBookable || false,
      status: status || 'Available'
    });

    await asset.save();
    const populated = await asset.populate('categoryId', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ success: false, message: 'Server error creating asset' });
  }
};
