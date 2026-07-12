const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');

exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate('categoryId', 'name').lean();
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
    const filteredAssets = enhancedAssets.filter(a => a.currentOwnerId !== userId);

    res.status(200).json({ success: true, data: filteredAssets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving assets', error: error.message });
  }
};
