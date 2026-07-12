const MaintenanceTicket = require('./models/MaintenanceTicket');
const Asset = require('../assets/models/Asset');
const User = require('../users/models/User');

// POST /api/maintenance
exports.createTicket = async (req, res) => {
  try {
    const { assetId, issueDescription, priority } = req.body;
    const requestedBy = req.user.id;

    if (!assetId || !issueDescription) {
      return res.status(400).json({ success: false, message: 'assetId and issueDescription are required.' });
    }

    let photoUrl = '';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const ticket = new MaintenanceTicket({
      assetId,
      requestedBy,
      issueDescription,
      priority: priority || 'Medium',
      photoUrl,
      status: 'Pending'
    });

    await ticket.save();
    
    // We don't change Asset status on Creation, it remains Available until Approved.

    const populated = await ticket.populate([
      { path: 'assetId', select: 'name assetTag' },
      { path: 'requestedBy', select: 'name' }
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error creating maintenance ticket:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/maintenance
exports.getTickets = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let query = {};
    if (role === 'Employee') {
      // Employee sees only their own requested tickets
      query = { requestedBy: userId };
    }
    // Managers/Admins see all tickets (empty query)

    const tickets = await MaintenanceTicket.find(query)
      .populate('assetId', 'name assetTag')
      .populate('requestedBy', 'name')
      .populate('assignedTechnicianId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('Error fetching maintenance tickets:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/maintenance/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const role = req.user.role;
    // Admins are view only, Employees cannot change status.
    if (role !== 'Asset Manager' && role !== 'Department Head') {
      return res.status(403).json({ success: false, message: 'Unauthorized to update ticket status.' });
    }

    const { status, resolutionNotes, assignedTechnicianId, externalTechnicianName } = req.body;
    const ticketId = req.params.id;

    const ticket = await MaintenanceTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const asset = await Asset.findById(ticket.assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Associated asset not found.' });
    }

    // STATE MACHINE LOGIC
    if (status === 'Approved') {
      ticket.status = 'Approved';
      ticket.approvedBy = req.user.id;
      asset.status = 'Under Maintenance';
      await asset.save();
    } 
    else if (status === 'Rejected') {
      ticket.status = 'Rejected';
      ticket.approvedBy = req.user.id;
      // Asset status remains unchanged
    } 
    else if (status === 'Technician Assigned') {
      if (ticket.status !== 'Approved') {
        return res.status(400).json({ success: false, message: 'Ticket must be Approved before assigning a technician.' });
      }
      if (!assignedTechnicianId && !externalTechnicianName) {
        return res.status(400).json({ success: false, message: 'Must provide an internal or external technician.' });
      }
      ticket.status = 'Technician Assigned';
      if (assignedTechnicianId) ticket.assignedTechnicianId = assignedTechnicianId;
      if (externalTechnicianName) ticket.externalTechnicianName = externalTechnicianName;
    } 
    else if (status === 'In Progress') {
      if (ticket.status !== 'Technician Assigned') {
        return res.status(400).json({ success: false, message: 'Technician must be assigned before starting progress.' });
      }
      ticket.status = 'In Progress';
    } 
    else if (status === 'Resolved') {
      ticket.status = 'Resolved';
      if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
      // Asset status reverts to Available
      asset.status = 'Available';
      await asset.save();
    } 
    else {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    await ticket.save();

    const populated = await ticket.populate([
      { path: 'assetId', select: 'name assetTag' },
      { path: 'requestedBy', select: 'name' },
      { path: 'assignedTechnicianId', select: 'name' }
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
