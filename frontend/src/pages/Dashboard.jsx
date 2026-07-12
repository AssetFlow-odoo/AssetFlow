import React, { useState } from 'react';
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
const BuildingIcon = (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
  </svg>
);
const CalendarIcon = (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
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

const stats = [
  { label: 'AVAILABLE',         value: '128', valueColor: '#34D399', icon: CheckCircleIcon, iconColor: '#34D399' },
  { label: 'ALLOCATED',         value: '76',  valueColor: '#A78BFA', icon: PersonIcon,      iconColor: '#A78BFA' },
  { label: 'AVAILABLE ROOMS',   value: '4',   valueColor: '#60A5FA', icon: BuildingIcon,    iconColor: '#60A5FA' },
  { label: 'ACTIVE BOOKINGS',   value: '9',   valueColor: '#FB923C', icon: CalendarIcon,    iconColor: '#FB923C' },
  { label: 'PENDING TRANSFERS', value: '3',   valueColor: '#F472B6', icon: ArrowRightIcon,  iconColor: '#F472B6' },
  { label: 'UPCOMING RETURNS',  value: '12',  valueColor: '#FACC15', icon: ClockIcon,       iconColor: '#FACC15' },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <AlertBanner />
          <ActionButtons />
          <RecentActivity />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
