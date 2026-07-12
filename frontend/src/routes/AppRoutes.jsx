import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from '../features/auth/Auth';
import Dashboard from '../pages/Dashboard';
import OrganizationSetup from '../pages/OrganizationSetup';
import AllocationTransfer from '../pages/AllocationTransfer';
import AdminRoute from '../components/AdminRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/allocation" element={<AllocationTransfer />} />
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
