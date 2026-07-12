import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from '../features/auth/Auth';
import Dashboard from '../pages/Dashboard';
import OrganizationSetup from '../pages/OrganizationSetup';
import AllocationTransfer from '../pages/AllocationTransfer';
import AdminRoute from '../components/AdminRoute';
import Assets from '../pages/Assets';
import ResourceBooking from '../pages/ResourceBooking';
import Maintenance from '../pages/Maintenance';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/assets" element={<Assets />} />
      <Route path="/allocation" element={<AllocationTransfer />} />
      <Route path="/booking" element={<ResourceBooking />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route 
        path="/organization-setup" 
        element={
          <AdminRoute>
            <OrganizationSetup />
          </AdminRoute>
        } 
      />
      {/* Add more routes here later */}
    </Routes>
  );
};

export default AppRoutes;
