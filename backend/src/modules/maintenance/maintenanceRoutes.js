const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { createTicket, getTickets, updateStatus } = require('./maintenanceController');
const authGuard = require('../../middleware/authGuard');

// Configure Multer for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.use(authGuard);

router.post('/', upload.single('photo'), createTicket);
router.get('/', getTickets);
router.put('/:id/status', updateStatus);

module.exports = router;
