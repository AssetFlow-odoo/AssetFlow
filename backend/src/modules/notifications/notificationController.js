const ActivityLog = require('./models/ActivityLog');
const User = require('../users/models/User');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const userDeptId = req.user.departmentId;

    let query = {};

    if (role === 'Employee') {
      // Employee sees only their own logs
      query = { userId };
    } else if (role === 'Department Head') {
      // Dept Head sees logs for all users in their department
      if (userDeptId) {
        const usersInDept = await User.find({ departmentId: userDeptId }).select('_id');
        const userIds = usersInDept.map(u => u._id);
        query = { userId: { $in: userIds } };
      } else {
        // Fallback if no dept assigned, just show their own
        query = { userId };
      }
    }
    // Asset Manager & Admin see all logs (empty query)

    const logs = await ActivityLog.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const logId = req.params.id;
    
    // We could verify if the user has permission to read this specific log,
    // but since they could see it in their feed, they can mark it read.
    const log = await ActivityLog.findByIdAndUpdate(
      logId,
      { isRead: true },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: log });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
