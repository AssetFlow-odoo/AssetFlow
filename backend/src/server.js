// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
// Import the routes
const authRoutes = require('./modules/auth/routes/authRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const assetsRoutes = require('./modules/assets/assets.routes');
const departmentRoutes = require('./modules/users/routes/departmentRoutes');
const userRoutes = require('./modules/users/routes/userRoutes');
const categoryRoutes = require('./modules/assets/routes/categoryRoutes');
const allocationRoutes = require('./modules/assets/routes/allocationRoutes');
const bookingsRoutes = require('./modules/bookings/bookings.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenanceRoutes');
const reportRoutes = require('./modules/reports/reportRoutes');
const path = require('path');

// Initialize the Express app
const app = express();

// Connect to the Database
connectDB();

// Built-in Express middleware
app.use(cors());
app.use(express.json());

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount the routes to a specific path
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('AssetFlow API is running...');
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});