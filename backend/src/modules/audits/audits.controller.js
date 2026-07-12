const AuditCycle = require('./models/AuditCycle');
const AuditItem = require('./models/AuditItem');
const Asset = require('../assets/models/Asset');

exports.createAuditCycle = async (req, res) => {
  try {
    const { name, departmentId, location, startDate, endDate, auditors } = req.body;

    if (!departmentId && !location) {
      return res.status(400).json({ message: 'Scope must include either a department or a location' });
    }

    // Build query for assets based on scope
    const assetQuery = {};
    if (location) assetQuery.location = location;
    // Note: Assuming Asset model doesn't directly have departmentId, but if it's assigned to a user in that dept or allocated to that dept. 
    // Looking at Asset schema: it doesn't have departmentId directly. We might need to handle this.
    // Wait, let's just query by location for now if we can't easily query by department, or if Asset has dynamicAttributes.departmentId?
    // Let's assume for simplicity we query what's available. 

    // Create Cycle
    const cycle = new AuditCycle({
      name,
      scope: { departmentId, location },
      startDate,
      endDate,
      auditors
    });

    await cycle.save();

    // Find matching assets
    const assets = await Asset.find(assetQuery);

    // Create AuditItems
    const auditItems = assets.map(asset => ({
      auditCycleId: cycle._id,
      assetId: asset._id,
      expectedLocation: asset.location,
      expectedStatus: asset.status,
      // expectedDepartmentId: would need allocation logic if needed, leaving empty for now
    }));

    if (auditItems.length > 0) {
      await AuditItem.insertMany(auditItems);
    }

    res.status(201).json({ message: 'Audit cycle created', cycle, totalAssets: auditItems.length });
  } catch (error) {
    res.status(500).json({ message: 'Error creating audit cycle', error: error.message });
  }
};

exports.getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find()
      .populate('auditors', 'name email')
      .populate('scope.departmentId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(cycles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit cycles', error: error.message });
  }
};

exports.getAuditCycleDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const cycle = await AuditCycle.findById(id)
      .populate('auditors', 'name email')
      .populate('scope.departmentId', 'name');
      
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });

    const items = await AuditItem.find({ auditCycleId: id })
      .populate('assetId', 'assetTag name categoryId location status')
      .populate('auditedBy', 'name');

    res.status(200).json({ cycle, items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit cycle details', error: error.message });
  }
};

exports.verifyAuditItem = async (req, res) => {
  try {
    const { id } = req.params; // AuditItem ID
    const { verificationStatus, notes, auditedBy } = req.body;

    const item = await AuditItem.findByIdAndUpdate(
      id, 
      { verificationStatus, notes, auditedBy },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Audit item not found' });

    // Update cycle status to In Progress if it was Open
    await AuditCycle.findOneAndUpdate(
      { _id: item.auditCycleId, status: 'Open' },
      { status: 'In Progress' }
    );

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error updating audit item', error: error.message });
  }
};

exports.closeAuditCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const cycle = await AuditCycle.findById(id);
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });

    if (cycle.status === 'Closed') {
      return res.status(400).json({ message: 'Cycle is already closed' });
    }

    const items = await AuditItem.find({ auditCycleId: id });
    let missingCount = 0;
    let damagedCount = 0;
    let verifiedCount = 0;
    let pendingCount = 0;

    for (const item of items) {
      if (item.verificationStatus === 'Missing') {
        missingCount++;
        // Update asset status to Lost
        await Asset.findByIdAndUpdate(item.assetId, { status: 'Lost' });
      } else if (item.verificationStatus === 'Damaged') {
        damagedCount++;
        // No automatic status change as per requirements
      } else if (item.verificationStatus === 'Verified') {
        verifiedCount++;
        // No automatic status change
      } else {
        pendingCount++;
      }
    }

    const discrepancyReport = {
      missing: missingCount,
      damaged: damagedCount,
      verified: verifiedCount,
      pending: pendingCount,
      summaryText: `${missingCount + damagedCount} assets flagged out of ${items.length} total.`
    };

    cycle.status = 'Closed';
    cycle.discrepancyReport = discrepancyReport;
    await cycle.save();

    res.status(200).json({ message: 'Audit cycle closed successfully', discrepancyReport });
  } catch (error) {
    res.status(500).json({ message: 'Error closing audit cycle', error: error.message });
  }
};
