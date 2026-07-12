const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('departmentId', 'name')
      .lean();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving users', error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['Admin', 'Asset Manager', 'Department Head', 'Employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { returnDocument: 'after' }
    )
    .populate('departmentId', 'name')
    .lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating user role', error: error.message });
  }
};
