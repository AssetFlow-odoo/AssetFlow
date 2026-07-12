import React from 'react';
import { Navigate } from 'react-router-dom';

// Protects routes that require authentication.
// For now, any logged-in user can access these pages.
// Role-based restriction can be re-enabled later as needed.
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;
