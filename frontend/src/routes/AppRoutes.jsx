import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from '../features/auth/Auth';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Auth />} />
      {/* Add more routes here later */}
    </Routes>
  );
};

export default AppRoutes;
