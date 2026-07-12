import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import Sidebar from '../components/Sidebar';
import './Reports.css';

const Reports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState({
    utilization: [],
    maintenanceFrequency: [],
    mostUsedAssets: [],
    idleAssets: [],
    nearingRetirement: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/reports/dashboard', { headers });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get('/api/reports/export', { 
        headers, 
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AssetFlow_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export report.');
    }
  };

  return (
    <div className="reports-page-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePage="reports" />

      <div className="reports-page-main">
        <div className="reports-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="hamburger-btn md:hidden block bg-gray-800 p-2 rounded cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="reports-page-title">
              <h1>Reports & Analytics</h1>
              <p>Actionable operational insights and asset health tracking.</p>
            </div>
          </div>
          <button className="export-btn cursor-pointer" onClick={handleExport} disabled={loading}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-400">Loading dashboard data...</div>
        ) : (
          <div className="reports-grid">
            
            {/* Top Row: Charts */}
            <div className="reports-row">
              <div className="report-card">
                <h2 className="report-card-title">Utilization by Department</h2>
                <div className="chart-container">
                  {data.utilization.length === 0 ? (
                    <div className="empty-state">No utilization data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.utilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="departmentName" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          contentStyle={{ backgroundColor: '#0f1117', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="report-card">
                <h2 className="report-card-title">Maintenance Frequency</h2>
                <div className="chart-container">
                  {data.maintenanceFrequency.length === 0 ? (
                    <div className="empty-state">No maintenance records found.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.maintenanceFrequency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f1117', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#6366f1' }}
                        />
                        <Line type="monotone" dataKey="tickets" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Row: Lists */}
            <div className="reports-row">
              <div className="report-card">
                <h2 className="report-card-title">Most Used Assets</h2>
                <div className="report-list">
                  {data.mostUsedAssets.length === 0 ? (
                    <div className="empty-state">No usage data found.</div>
                  ) : (
                    data.mostUsedAssets.map((asset, index) => (
                      <div key={index} className="report-list-item">
                        <div className="list-item-left">
                          <span className="list-item-name">{asset.name}</span>
                          <span className="list-item-tag">{asset.assetTag}</span>
                        </div>
                        <div className="list-item-right" title="Total Historical Allocations">
                          {asset.usageCount} uses
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="report-card">
                <h2 className="report-card-title">Idle Assets (&gt;45 days)</h2>
                <div className="report-list">
                  {data.idleAssets.length === 0 ? (
                    <div className="empty-state">No idle assets found.</div>
                  ) : (
                    data.idleAssets.map((asset, index) => (
                      <div key={index} className="report-list-item">
                        <div className="list-item-left">
                          <span className="list-item-name">{asset.name}</span>
                          <span className="list-item-tag">{asset.assetTag}</span>
                        </div>
                        <div className="list-item-right" title="Days since last status change">
                          {asset.daysUnused} days unused
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Alerts */}
            <div className="report-card">
              <h2 className="report-card-title text-red-400">Assets Due For Maintenance / Nearing Retirement</h2>
              <div className="report-list">
                {data.nearingRetirement.length === 0 ? (
                  <div className="empty-state">No assets nearing retirement.</div>
                ) : (
                  data.nearingRetirement.map((asset, index) => (
                    <div key={index} className="report-list-item border border-red-900/30">
                      <div className="list-item-left">
                        <span className="list-item-name">{asset.name}</span>
                        <span className="list-item-tag">{asset.assetTag}</span>
                      </div>
                      <div className="list-item-right list-item-right--alert" title="Age based on acquisition date">
                        {asset.ageYears} years old
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
