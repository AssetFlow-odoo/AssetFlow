const mongoose = require('mongoose');
const Allocation = require('../assets/models/Allocation');
const MaintenanceTicket = require('../maintenance/models/MaintenanceTicket');
const Asset = require('../assets/models/Asset');

const generateReportData = async (req) => {
  const role = req.user.role;
  const userDeptId = req.user.departmentId;

  // 1. Utilization by Department
  // Filter allocations that are Active
  let allocationMatch = { status: 'Active' };

  const utilizationData = await Allocation.aggregate([
    { $match: allocationMatch },
    // Lookup user to get their department
    {
      $lookup: {
        from: 'users',
        localField: 'assignedToUser',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    // Lookup department details
    {
      $lookup: {
        from: 'departments',
        localField: 'user.departmentId',
        foreignField: '_id',
        as: 'department'
      }
    },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$department._id',
        departmentName: { $first: '$department.name' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        departmentName: { $ifNull: ['$departmentName', 'Unassigned'] },
        count: 1,
        departmentId: '$_id'
      }
    }
  ]);

  // Filter utilization data for Department Heads
  let filteredUtilization = utilizationData;
  if (role === 'Department Head' && userDeptId) {
    filteredUtilization = utilizationData.filter(d => d.departmentId?.toString() === userDeptId.toString());
  }

  // 2. Maintenance Frequency (Group by Month)
  // For simplicity, we'll fetch all tickets and group by month of creation. 
  // If dept head, we technically need to filter assets owned by dept, but MaintenanceTicket 
  // doesn't directly have deptId. We will filter by requestedBy user's dept.
  let maintenanceMatch = {};
  if (role === 'Department Head' && userDeptId) {
    // We need to look up requestedBy user's dept.
    // Instead of doing it in aggregation, we can use a simpler approach or complex agg.
    // Let's use aggregation.
  }
  
  const maintenancePipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'requestedBy',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
  ];

  if (role === 'Department Head' && userDeptId) {
    maintenancePipeline.push({
      $match: {
        'user.departmentId': new mongoose.Types.ObjectId(userDeptId)
      }
    });
  }

  maintenancePipeline.push(
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  );

  const maintenanceResult = await MaintenanceTicket.aggregate(maintenancePipeline);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maintenanceData = maintenanceResult.map(m => ({
    month: monthNames[m._id - 1],
    tickets: m.count
  }));

  // 3. Most Used Assets
  // Group all historical allocations by assetId
  const mostUsedPipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'assignedToUser',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
  ];

  if (role === 'Department Head' && userDeptId) {
    mostUsedPipeline.push({
      $match: {
        'user.departmentId': new mongoose.Types.ObjectId(userDeptId)
      }
    });
  }

  mostUsedPipeline.push(
    {
      $group: {
        _id: '$assetId',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'assets',
        localField: '_id',
        foreignField: '_id',
        as: 'asset'
      }
    },
    { $unwind: '$asset' },
    {
      $project: {
        _id: 0,
        assetId: '$_id',
        name: '$asset.name',
        assetTag: '$asset.assetTag',
        usageCount: '$count'
      }
    }
  );

  const mostUsedAssets = await Allocation.aggregate(mostUsedPipeline);

  // 4. Idle Assets
  // Assets with status 'Available' where updatedAt is older than 45 days.
  const fortyFiveDaysAgo = new Date();
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

  let idleMatch = {
    status: 'Available',
    updatedAt: { $lt: fortyFiveDaysAgo }
  };

  // If department head, it's tricky to know "idle assets of a department" because Available assets are typically unassigned.
  // We'll return all idle assets, or empty if we strictly want dept-only. We will return global idle assets 
  // unless we want to filter by last allocated department. For MVP, we'll just show them globally or hide for dept head.
  // We'll allow dept heads to see global idle assets to request them.

  const idleAssetsRaw = await Asset.find(idleMatch).select('name assetTag updatedAt').limit(10).lean();
  const idleAssets = idleAssetsRaw.map(a => {
    const daysUnused = Math.floor((new Date() - new Date(a.updatedAt)) / (1000 * 60 * 60 * 24));
    return { name: a.name, assetTag: a.assetTag, daysUnused };
  });

  // 5. Nearing Retirement / Maintenance Due
  // Assets where acquisitionDate is older than 4 years.
  const fourYearsAgo = new Date();
  fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

  const retiringAssetsRaw = await Asset.find({
    acquisitionDate: { $lt: fourYearsAgo },
    status: { $nin: ['Retired', 'Disposed'] }
  }).select('name assetTag acquisitionDate').limit(10).lean();

  const nearingRetirement = retiringAssetsRaw.map(a => {
    const ageYears = ((new Date() - new Date(a.acquisitionDate)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
    return { name: a.name, assetTag: a.assetTag, ageYears };
  });

  return {
    utilization: filteredUtilization,
    maintenanceFrequency: maintenanceData,
    mostUsedAssets,
    idleAssets,
    nearingRetirement
  };
};

exports.getDashboardData = async (req, res) => {
  try {
    const data = await generateReportData(req);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error generating report data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const data = await generateReportData(req);

    let csvContent = '';

    // Utilization
    csvContent += '--- Utilization by Department ---\n';
    csvContent += 'Department Name,Active Allocations\n';
    data.utilization.forEach(row => {
      csvContent += `${row.departmentName},${row.count}\n`;
    });
    csvContent += '\n';

    // Maintenance Frequency
    csvContent += '--- Maintenance Tickets by Month ---\n';
    csvContent += 'Month,Tickets\n';
    data.maintenanceFrequency.forEach(row => {
      csvContent += `${row.month},${row.tickets}\n`;
    });
    csvContent += '\n';

    // Most Used Assets
    csvContent += '--- Most Used Assets ---\n';
    csvContent += 'Asset Name,Asset Tag,Historical Allocations\n';
    data.mostUsedAssets.forEach(row => {
      csvContent += `"${row.name}",${row.assetTag},${row.usageCount}\n`;
    });
    csvContent += '\n';

    // Idle Assets
    csvContent += '--- Idle Assets (> 45 days) ---\n';
    csvContent += 'Asset Name,Asset Tag,Days Unused\n';
    data.idleAssets.forEach(row => {
      csvContent += `"${row.name}",${row.assetTag},${row.daysUnused}\n`;
    });
    csvContent += '\n';

    // Nearing Retirement
    csvContent += '--- Assets Nearing Retirement (> 4 years) ---\n';
    csvContent += 'Asset Name,Asset Tag,Age (Years)\n';
    data.nearingRetirement.forEach(row => {
      csvContent += `"${row.name}",${row.assetTag},${row.ageYears}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`AssetFlow_Report_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvContent);

  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
