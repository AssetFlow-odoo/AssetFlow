import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import ActionButtons from '../components/ActionButtons';
import RecentActivity from '../components/RecentActivity';
import './Dashboard.css';

/* ── Icons ── */
const CheckCircleIcon = (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const PersonIcon = (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
  </svg>
);
const ArrowRightIcon = (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
  </svg>
);
const ClockIcon = (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const CalendarIcon = (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
  </svg>
);

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      available: 0,
      allocated: 0,
      activeBookings: 0,
      pendingTransfers: 0,
      upcomingReturns: 0,
    },
    recentActivity: [],
    alerts: { overdueReturns: 0, pendingMaintenance: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats');
        if (res.data.success) {
          setDashboardData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const statsList = [
    { label: 'AVAILABLE',         value: dashboardData.stats.available.toString(), valueColor: '#34D399', icon: CheckCircleIcon, iconColor: '#34D399' },
    { label: 'ALLOCATED',         value: dashboardData.stats.allocated.toString(),  valueColor: '#A78BFA', icon: PersonIcon,      iconColor: '#A78BFA' },
    { label: 'ACTIVE BOOKINGS',   value: dashboardData.stats.activeBookings.toString(),   valueColor: '#FB923C', icon: CalendarIcon,    iconColor: '#FB923C' },
    { label: 'PENDING TRANSFERS', value: dashboardData.stats.pendingTransfers.toString(),   valueColor: '#F472B6', icon: ArrowRightIcon,  iconColor: '#F472B6' },
    { label: 'UPCOMING RETURNS',  value: dashboardData.stats.upcomingReturns.toString(),  valueColor: '#FACC15', icon: ClockIcon,       iconColor: '#FACC15' },
  ];

  return (
    <div className="db-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="db-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="db-content">
          <div className="db-stats">
            {statsList.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {!loading && <AlertBanner alerts={dashboardData.alerts} />}
          <ActionButtons />
          <RecentActivity activities={dashboardData.recentActivity} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
