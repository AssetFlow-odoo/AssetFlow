import React from 'react';
import './AssetsTable.css';

const assets = [
  { id: 1, name: 'MacBook Pro 16"',     serial: 'C02DG123AB45',  date: 'Oct 12, 2025', status: 'Active' },
  { id: 2, name: 'Dell UltraSharp 27"', serial: 'MX9876543210',  date: 'Oct 14, 2025', status: 'Active' },
  { id: 3, name: 'Keychron K2 Keyboard',serial: 'KY-K2-998877',  date: 'Nov 01, 2025', status: 'Active' },
];

const AssetsTable = () => (
  <div className="assets-card">
    <div className="assets-card-header">
      <div>
        <h2 className="assets-title">My Assets</h2>
        <p className="assets-subtitle">List of assets currently assigned to you</p>
      </div>
    </div>

    <div className="table-wrap">
      <table className="assets-table">
        <thead>
          <tr>
            <th>ASSET NAME</th>
            <th>SERIAL NO</th>
            <th>ASSIGNED DATE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id}>
              <td>
                <div className="asset-name-cell">
                  <div className="asset-icon">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <span className="asset-name-text">{a.name}</span>
                </div>
              </td>
              <td><span className="mono-text">{a.serial}</span></td>
              <td><span className="date-text">{a.date}</span></td>
              <td>
                <span className="badge badge-active">Active</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AssetsTable;
