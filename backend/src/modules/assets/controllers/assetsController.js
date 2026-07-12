const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const Allocation = require('../models/Allocation');

// GET /api/assets
exports.getAssets = async (req, res) => {
  try {
    const { search, categoryId, status, forAllocation } = req.query;
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

    // Filter out shared bookable resources if requested for allocation page
    if (forAllocation === 'true') {
      query.isSharedBookable = { $ne: true };
    }

    const assets = await Asset.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    let finalAssets = assets;

    if (forAllocation === 'true') {
      const userId = req.user.id;
      
      const enhancedAssets = await Promise.all(assets.map(async (asset) => {
        if (asset.status === 'Allocated') {
          const alloc = await Allocation.findOne({ assetId: asset._id, status: 'Active' })
            .populate('assignedToUser', 'name')
            .lean();
          if (alloc && alloc.assignedToUser) {
            asset.currentOwnerName = alloc.assignedToUser.name;
            asset.currentOwnerId = alloc.assignedToUser._id.toString();
          }
        }
        return asset;
      }));

      // Filter out assets actively allocated to the logged-in user
      finalAssets = enhancedAssets.filter(a => a.currentOwnerId !== userId);
    }

    res.status(200).json({
      success: true,
      count: finalAssets.length,
      data: finalAssets
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
    if (req.user.role !== 'Asset Manager') {
      return res.status(403).json({ success: false, message: 'Only Asset Managers can register assets' });
    }

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
