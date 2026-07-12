const mongoose = require('mongoose');
require('dotenv').config();

const ActivityLog = require('./src/modules/notifications/models/ActivityLog');
const User = require('./src/modules/users/models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/assetflow');
    console.log('Connected to DB');

    const users = await User.find();
    if (users.length === 0) {
      console.log('No users found to assign notifications to.');
      process.exit(0);
    }
    
    // Pick the first user (likely the admin or the logged in user)
    const admin = users.find(u => u.role === 'Admin') || users[0];
    const employee = users.find(u => u.role === 'Employee') || users[0];

    const logs = [
      {
        userId: admin._id,
        actionType: 'OVERDUE_ALERT',
        message: 'MacBook Pro 16-inch is overdue by 3 days.',
        isRead: false
      },
      {
        userId: employee._id,
        actionType: 'ASSET_ASSIGNED',
        message: 'Dell XPS 15 has been assigned to you.',
        isRead: false
      },
      {
        userId: admin._id,
        actionType: 'MAINTENANCE_APPROVED',
        message: 'Maintenance for Projector 4K has been approved.',
        isRead: false
      },
      {
        userId: employee._id,
        actionType: 'BOOKING_CONFIRMED',
        message: 'Conference Room A booked successfully.',
        isRead: false
      },
      {
        userId: admin._id,
        actionType: 'AUDIT_DISCREPANCY',
        message: 'Missing asset tag on external monitor.',
        isRead: false
      }
    ];

    await ActivityLog.insertMany(logs);
    console.log('Successfully seeded notifications.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
