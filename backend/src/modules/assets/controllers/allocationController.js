const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset');
const ActivityLog = require('../../notifications/models/ActivityLog');
const User = require('../../users/models/User');

// POST /api/allocations/request
exports.requestAllocation = async (req, res) => {
  try {
    const { assetId, assignedToUser, reason, expectedReturnDate } = req.body;
    const requestorId = req.user.id;
    const requestorRole = req.user.role;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Determine the target user (either specified in form, or self for Employees)
    const targetUserId = assignedToUser || requestorId;

    // Fetch the target user to get their department
    const targetUser = await User.findById(targetUserId);
    const targetDepartmentId = targetUser ? targetUser.departmentId : null;

    // Prevent duplicate pending requests for the same asset by the same target user
    const existingPending = await Allocation.findOne({
      assetId,
      assignedToUser: targetUserId,
      status: { $in: ['Pending Approval', 'TransferPending'] }
    });

    if (existingPending) {
      return res.status(409).json({ success: false, message: 'A pending request already exists for this user and asset.' });
    }

    if (asset.status === 'Available') {
      // SCENARIO A: Asset is Available
      
      let status = 'Pending Approval';
      if (requestorRole === 'Asset Manager') {
        status = 'Active';
      }

      const allocation = new Allocation({
        assetId,
        assignedToUser: targetUserId,
        assignedToDepartment: targetDepartmentId,
        allocatedBy: requestorId,
        reason,
        expectedReturnDate,
        status,
        type: 'Allocation'
      });

      await allocation.save();

      // If Asset Manager allocated it directly, update asset status
      if (status === 'Active') {
        asset.status = 'Allocated';
        await asset.save();
        
        await ActivityLog.create({
          userId: requestorId,
          actionType: 'Allocation',
          message: `Directly allocated ${asset.name}`,
          referenceId: allocation._id
        });
      }

      return res.status(201).json({ success: true, data: allocation });
      
    } else if (asset.status === 'Allocated') {
      // SCENARIO B: Asset is already Allocated (Double-allocation block -> Transfer)
      
      // Find the current active allocation for this asset
      const currentAllocation = await Allocation.findOne({ assetId, status: 'Active' });
      if (!currentAllocation) {
        return res.status(500).json({ success: false, message: 'Data inconsistency: Asset is allocated but no active allocation found.' });
      }

      const transferRequest = new Allocation({
        assetId,
        assignedToUser: targetUserId,
        assignedToDepartment: targetDepartmentId,
        allocatedBy: requestorId,
        reason,
        expectedReturnDate,
        status: 'TransferPending',
        type: 'Transfer',
        oldAllocationId: currentAllocation._id
      });

      await transferRequest.save();

      return res.status(201).json({ success: true, data: transferRequest });
    } else {
      return res.status(400).json({ success: false, message: `Cannot request asset with status: ${asset.status}` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/allocations/pending
exports.getPendingQueue = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let query = {};

    if (role === 'Employee') {
      // Employees see their own requests (either they are the target or they requested it)
      query = { 
        status: { $in: ['Pending Approval', 'TransferPending'] },
        $or: [{ assignedToUser: userId }, { allocatedBy: userId }]
      };
    } else if (role === 'Department Head') {
      // Dept Heads see requests for their department
      const user = await User.findById(userId);
      query = {
        status: { $in: ['Pending Approval', 'TransferPending'] },
        assignedToDepartment: user.departmentId
      };
    } else if (role === 'Asset Manager' || role === 'Admin') {
      // Asset Managers and Admins see all pending
      query = {
        status: { $in: ['Pending Approval', 'TransferPending'] }
      };
    }

    const requests = await Allocation.find(query)
      .populate('assetId', 'name assetTag')
      .populate('assignedToUser', 'name')
      .populate('allocatedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/allocations/recent
exports.getRecentAllocations = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let query = {};

    if (role === 'Employee') {
      // Employees see their own allocations
      query = { 
        status: { $in: ['Active', 'Returned'] },
        assignedToUser: userId
      };
    } else if (role === 'Department Head') {
      // Dept Heads see allocations for their department
      const user = await User.findById(userId);
      query = {
        status: { $in: ['Active', 'Returned'] },
        assignedToDepartment: user.departmentId
      };
    } else if (role === 'Asset Manager' || role === 'Admin') {
      // Asset Managers and Admins see all recent allocations
      query = {
        status: { $in: ['Active', 'Returned'] }
      };
    }

    const allocations = await Allocation.find(query)
      .populate('assetId', 'name assetTag')
      .populate('assignedToUser', 'name')
      .populate('allocatedBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(20) // Limit to 20 most recent
      .lean();

    res.status(200).json({ success: true, data: allocations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/allocations/:id/approve
exports.approveRequest = async (req, res) => {
  try {
    if (!['Asset Manager', 'Department Head'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to approve requests' });
    }

    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!['Pending Approval', 'TransferPending'].includes(allocation.status)) {
      return res.status(400).json({ success: false, message: 'Request is not pending' });
    }

    const asset = await Asset.findById(allocation.assetId);

    if (allocation.type === 'Transfer' && allocation.oldAllocationId) {
      // Handle Transfer logic
      const oldAlloc = await Allocation.findById(allocation.oldAllocationId);
      if (oldAlloc && oldAlloc.status === 'Active') {
        oldAlloc.status = 'Returned';
        oldAlloc.actualReturnDate = new Date();
        await oldAlloc.save();
      }
    }

    allocation.status = 'Active';
    await allocation.save();

    asset.status = 'Allocated';
    await asset.save();

    await ActivityLog.create({
      userId: allocation.assignedToUser,
      actionType: allocation.type === 'Transfer' ? 'TRANSFER_APPROVED' : 'ASSET_ASSIGNED',
      message: `Your ${allocation.type.toLowerCase()} request for ${asset.name} has been approved.`,
      referenceId: allocation._id
    });

    res.status(200).json({ success: true, data: allocation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/allocations/:id/reject
exports.rejectRequest = async (req, res) => {
  try {
    if (!['Asset Manager', 'Department Head'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reject requests' });
    }

    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ success: false, message: 'Request not found' });

    allocation.status = 'Rejected';
    await allocation.save();

    res.status(200).json({ success: true, message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
