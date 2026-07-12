const AssetCategory = require('../models/AssetCategory');
const Asset = require('../models/Asset');

exports.getCategories = async (req, res) => {
  try {
    const categories = await AssetCategory.find().lean();
    
    // Fetch asset count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const assetCount = await Asset.countDocuments({ categoryId: category._id });
        return { ...category, assetCount };
      })
    );

    res.status(200).json({ success: true, data: categoriesWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving categories', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, customFields } = req.body;
    
    const existing = await AssetCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    const category = new AssetCategory({
      name,
      customFields: customFields || []
    });

    await category.save();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating category', error: error.message });
  }
};
