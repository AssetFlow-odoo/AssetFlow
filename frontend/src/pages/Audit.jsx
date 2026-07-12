import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './Audit.css';

const Audit = () => {
  const [cycles, setCycles] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null);
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCycle, setNewCycle] = useState({
    name: '',
    departmentId: '',
    location: '',
    startDate: '',
    endDate: '',
    auditors: []
  });

  useEffect(() => {
    fetchCycles();
    fetchDepartmentsAndAuditors();
  }, []);

  const fetchCycles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/audits/cycles');
      setCycles(res.data);
    } catch (err) {
      console.error('Failed to fetch cycles', err);
    }
  };

  const fetchDepartmentsAndAuditors = async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        axios.get('http://localhost:5000/api/departments'),
        axios.get('http://localhost:5000/api/users')
      ]);
      const deptsData = deptRes.data.data || [];
      const usersData = userRes.data.data || [];
      
      setDepartments(deptsData);
      
      const auditDept = deptsData.find(d => d.name.toLowerCase() === 'auditors');
      if (auditDept) {
        const auditUsers = usersData.filter(u => u.departmentId && u.departmentId._id === auditDept._id);
        setAuditors(auditUsers);
      }
    } catch (err) {
      console.error('Failed to fetch departments/users', err);
    }
  };

  const loadCycleDetails = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/audits/cycles/${id}`);
      setActiveCycle(res.data.cycle);
      setItems(res.data.items);
    } catch (err) {
      console.error('Failed to load cycle details', err);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newCycle.name,
        startDate: newCycle.startDate,
        endDate: newCycle.endDate,
        auditors: newCycle.auditors,
        ...(newCycle.departmentId && { departmentId: newCycle.departmentId }),
        ...(newCycle.location && { location: newCycle.location })
      };
      
      await axios.post('http://localhost:5000/api/audits/cycles', payload);
      setShowCreateModal(false);
      setNewCycle({ name: '', departmentId: '', location: '', startDate: '', endDate: '', auditors: [] });
      fetchCycles();
    } catch (err) {
      console.error('Failed to create cycle', err);
      alert('Error creating cycle');
    }
  };

  const updateItemStatus = async (itemId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/audits/items/${itemId}/verify`, {
        verificationStatus: status,
        // auditedBy: would be current user ID in a real auth flow
      });
      // Refresh items to show new status
      loadCycleDetails(activeCycle._id);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const closeCycle = async () => {
    if (!window.confirm("Are you sure you want to close this audit cycle? Asset statuses will be updated automatically based on findings.")) {
      return;
    }
    
    try {
      await axios.post(`http://localhost:5000/api/audits/cycles/${activeCycle._id}/close`);
      loadCycleDetails(activeCycle._id);
      fetchCycles();
      alert("Audit cycle closed successfully.");
    } catch (err) {
      console.error('Failed to close cycle', err);
      alert('Error closing cycle');
    }
  };

  // Mockup Format formatting
  const getCycleHeader = () => {
    if (!activeCycle) return '';
    const dateStr = `${new Date(activeCycle.startDate).toLocaleDateString()} - ${new Date(activeCycle.endDate).toLocaleDateString()}`;
    const scopeStr = activeCycle.scope.departmentId ? activeCycle.scope.departmentId.name : activeCycle.scope.location;
    return `${activeCycle.name}: ${scopeStr} | ${dateStr}`;
  };
  
  const getAuditorsString = () => {
    if (!activeCycle || !activeCycle.auditors) return '';
    return `Auditors: ${activeCycle.auditors.map(a => a.name).join(', ')}`;
  };

  const getDiscrepancySummary = () => {
    if (activeCycle && activeCycle.status === 'Closed' && activeCycle.discrepancyReport) {
      return activeCycle.discrepancyReport.summaryText;
    }
    const flagged = items.filter(i => i.verificationStatus === 'Missing' || i.verificationStatus === 'Damaged').length;
    return `${flagged} assets flagged - discrepancy report generated automatically`;
  };

  return (
    <div className="audit-page-layout">
      <Sidebar />
      <div className="audit-page-main">
        <div className="audit-page-header">
          <div className="audit-page-title">
            <h1>Asset Audit</h1>
            <p>Run structured verification cycles and auto-generate discrepancy reports</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Start New Audit Cycle
          </button>
        </div>

        <div className="audit-content">
          {!activeCycle ? (
            <div className="cycles-list-container">
              <h2>Recent Audit Cycles</h2>
              <div className="cycles-grid">
                {cycles.length === 0 ? (
                  <p className="no-data">No audit cycles found.</p>
                ) : (
                  cycles.map(cycle => (
                    <div key={cycle._id} className="cycle-card" onClick={() => loadCycleDetails(cycle._id)}>
                      <div className="cycle-card-header">
                        <h3>{cycle.name}</h3>
                        <span className={`status-badge status-${cycle.status.toLowerCase().replace(' ', '-')}`}>{cycle.status}</span>
                      </div>
                      <div className="cycle-card-body">
                        <p><strong>Scope:</strong> {cycle.scope.departmentId ? cycle.scope.departmentId.name : cycle.scope.location}</p>
                        <p><strong>Dates:</strong> {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="audit-details-container">
              <button className="btn-secondary back-btn" onClick={() => setActiveCycle(null)}>
                ← Back to Cycles
              </button>
              
              <div className="audit-info-panel">
                <h2>{getCycleHeader()}</h2>
                <p>{getAuditorsString()}</p>
              </div>

              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Expected location</th>
                      <th>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>No assets found for this scope.</td>
                      </tr>
                    ) : (
                      items.map(item => (
                        <tr key={item._id}>
                          <td>{item.assetId ? `${item.assetId.assetTag} ${item.assetId.name}` : 'Unknown Asset'}</td>
                          <td>{item.expectedLocation || '-'}</td>
                          <td>
                            {activeCycle.status === 'Closed' ? (
                              <span className={`status-badge status-${item.verificationStatus.toLowerCase()}`}>{item.verificationStatus}</span>
                            ) : (
                              <div className="verification-buttons">
                                <button 
                                  className={`btn-verify ${item.verificationStatus === 'Verified' ? 'active' : ''}`}
                                  onClick={() => updateItemStatus(item._id, 'Verified')}
                                >
                                  Verified
                                </button>
                                <button 
                                  className={`btn-missing ${item.verificationStatus === 'Missing' ? 'active' : ''}`}
                                  onClick={() => updateItemStatus(item._id, 'Missing')}
                                >
                                  Missing
                                </button>
                                <button 
                                  className={`btn-damaged ${item.verificationStatus === 'Damaged' ? 'active' : ''}`}
                                  onClick={() => updateItemStatus(item._id, 'Damaged')}
                                >
                                  Damaged
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="discrepancy-panel">
                <p>{getDiscrepancySummary()}</p>
              </div>

              {activeCycle.status !== 'Closed' && (
                <div className="audit-actions">
                  <button className="btn-close-cycle" onClick={closeCycle}>Close audit cycle</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content create-cycle-modal">
            <h2>Start New Audit Cycle</h2>
            <form onSubmit={handleCreateCycle}>
              <div className="form-group">
                <label>Cycle Name</label>
                <input type="text" required value={newCycle.name} onChange={e => setNewCycle({...newCycle, name: e.target.value})} placeholder="e.g., Q3 audit: Engineering dept" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Department (Optional)</label>
                  <select value={newCycle.departmentId} onChange={e => setNewCycle({...newCycle, departmentId: e.target.value})}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location (Optional)</label>
                  <input type="text" value={newCycle.location} onChange={e => setNewCycle({...newCycle, location: e.target.value})} placeholder="e.g., Desk E12" />
                </div>
              </div>
              <p className="help-text">You must select either a department, a location, or both.</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" required value={newCycle.startDate} onChange={e => setNewCycle({...newCycle, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" required value={newCycle.endDate} onChange={e => setNewCycle({...newCycle, endDate: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Assign Auditors</label>
                <select multiple required value={newCycle.auditors} onChange={e => {
                  const options = [...e.target.selectedOptions];
                  setNewCycle({...newCycle, auditors: options.map(o => o.value)});
                }}>
                  {auditors.length === 0 ? (
                    <option disabled value="">No employees found in 'Auditors' department</option>
                  ) : (
                    auditors.map(u => <option key={u._id} value={u._id}>{u.name}</option>)
                  )}
                </select>
                <p className="help-text">Hold Ctrl/Cmd to select multiple. Only employees in the 'Auditors' department are shown.</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
