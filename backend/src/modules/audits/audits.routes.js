const express = require('express');
const router = express.Router();
const {
  createAuditCycle,
  getAuditCycles,
  getAuditCycleDetails,
  verifyAuditItem,
  closeAuditCycle
} = require('./audits.controller');

// Create a new audit cycle
router.post('/cycles', createAuditCycle);

// Get all audit cycles
router.get('/cycles', getAuditCycles);

// Get details of a specific audit cycle (including its items)
router.get('/cycles/:id', getAuditCycleDetails);

// Update/verify a specific audit item
router.put('/items/:id/verify', verifyAuditItem);

// Close an audit cycle
router.post('/cycles/:id/close', closeAuditCycle);

module.exports = router;
