import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import Sidebar from '../components/Sidebar';
import './Notifications.css';

// Action Categories Mapping
const CATEGORIES = {
  Alerts: ['OVERDUE_ALERT', 'AUDIT_DISCREPANCY'],
  Approvals: ['ASSET_ASSIGNED', 'TRANSFER_APPROVED', 'MAINTENANCE_APPROVED', 'MAINTENANCE_REJECTED'],
  Bookings: ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED']
};

const getIconForAction = (actionType) => {
  if (CATEGORIES.Alerts.includes(actionType)) {
    return (
      <div className="notification-icon icon--alert">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  }
  if (CATEGORIES.Approvals.includes(actionType)) {
    return (
      <div className="notification-icon icon--approval">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  if (CATEGORIES.Bookings.includes(actionType)) {
    return (
      <div className="notification-icon icon--booking">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  // Default General
  return (
    <div className="notification-icon icon--general">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
};

const Notifications = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/notifications', { headers });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, isAlreadyRead) => {
    if (isAlreadyRead) return;

    // Optimistic UI Update
    setLogs(prev => prev.map(log => log._id === id ? { ...log, isRead: true } : log));

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`/api/notifications/${id}/read`, {}, { headers });
    } catch (err) {
      console.error('Error marking as read:', err);
      // Revert if failed
      setLogs(prev => prev.map(log => log._id === id ? { ...log, isRead: false } : log));
    }
  };

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'All') return true;
    return CATEGORIES[activeTab]?.includes(log.actionType);
  });

  return (
    <div className="notifications-page-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePage="notifications" />

      <div className="notifications-page-main">
        <div className="notifications-page-header">
          <button className="hamburger-btn md:hidden block bg-gray-800 p-2 rounded cursor-pointer" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="notifications-page-title">
            <h1>Activity Logs & Notifications</h1>
            <p>Your audit trail and system updates.</p>
          </div>
        </div>

        <div className="notifications-tabs">
          {['All', 'Alerts', 'Approvals', 'Bookings'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-400">Loading notifications...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="notifications-empty">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No notifications found for this category.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredLogs.map(log => (
              <div 
                key={log._id} 
                className={`notification-item ${!log.isRead ? 'notification-item--unread' : ''}`}
                onClick={() => handleMarkAsRead(log._id, log.isRead)}
              >
                {getIconForAction(log.actionType)}
                
                <div className="notification-content">
                  <div className="notification-message">{log.message}</div>
                </div>
                
                <div className="notification-time">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
