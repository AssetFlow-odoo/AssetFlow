// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
// Import the routes
const authRoutes = require('./modules/auth/routes/authRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

// Initialize the Express app
const app = express();

// Connect to the Database
connectDB();

// Built-in Express middleware
app.use(cors());
app.use(express.json());
// Mount the routes to a specific path
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('AssetFlow API is running...');
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});