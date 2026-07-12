const Asset = require('../assets/models/Asset');
const Allocation = require('../assets/models/Allocation');
const Booking = require('../bookings/models/Booking');
const MaintenanceTicket = require('../maintenance/models/MaintenanceTicket');
const ActivityLog = require('../notifications/models/ActivityLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const availableAssets = await Asset.countDocuments({ status: 'Available' });
    const allocatedAssets = await Asset.countDocuments({ status: 'Allocated' });
    const activeBookings = await Booking.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } });
    const pendingTransfers = await Allocation.countDocuments({ status: 'TransferPending' });
    
    // Upcoming returns: Allocations active and expectedReturnDate within next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingReturns = await Allocation.countDocuments({ 
      status: 'Active', 
      expectedReturnDate: { $gte: new Date(), $lte: nextWeek } 
    });

    // Recent activity
    const recentLogs = await ActivityLog.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentActivity = recentLogs.map(log => {
      let icon = 'ℹ️';
      let iconBg = '#1A2A3A';
      
      const type = log.actionType.toLowerCase();
      if (type.includes('book')) { icon = '📅'; iconBg = '#1A2A3A'; }
      else if (type.includes('mainten') || type.includes('ticket')) { icon = '🔧'; iconBg = '#2A1A2A'; }
      else if (type.includes('allocat')) { icon = '💻'; iconBg = '#1A2A4A'; }
      else if (type.includes('asset')) { icon = '📦'; iconBg = '#1A2A2A'; }
      
      return {
        id: log._id,
        name: log.userId ? log.userId.name : 'System',
        detail: log.message,
        time: log.createdAt,
        icon,
        iconBg
      };
    });

    // Alerts
    const overdueReturnsCount = await Allocation.countDocuments({ 
      status: 'Active', 
      expectedReturnDate: { $lt: new Date() } 
    });
    const pendingMaintenanceCount = await MaintenanceTicket.countDocuments({ status: 'Open' });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          available: availableAssets,
          allocated: allocatedAssets,
          activeBookings: activeBookings,
          pendingTransfers: pendingTransfers,
          upcomingReturns: upcomingReturns,
        },
        recentActivity,
        alerts: {
          overdueReturns: overdueReturnsCount,
          pendingMaintenance: pendingMaintenanceCount,
        }
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard stats' });
  }
};
