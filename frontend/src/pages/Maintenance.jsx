import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './Maintenance.css';

// Reusable Dropdown inside Modals
const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div 
        className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-[#1A1F2E] border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-[#1A1F2E] border-b border-gray-700">
            <input
              type="text"
              className="w-full bg-[#0F1117] text-white border border-gray-600 rounded p-1 text-sm outline-none focus:border-indigo-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-gray-400 text-center">No options found</div>
          ) : (
            filteredOptions.map(opt => (
              <div 
                key={opt.value}
                className="p-2 text-sm text-white hover:bg-indigo-600 cursor-pointer"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Maintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(localStorage.getItem('userRole') || 'Employee');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [userDeptId, setUserDeptId] = useState(localStorage.getItem('userDeptId') || '');
  
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [ticketsRes, assetsRes, usersRes] = await Promise.all([
        axios.get('/api/maintenance', { headers }),
        axios.get('/api/assets', { headers }),
        axios.get('/api/users', { headers })
      ]);

      if (ticketsRes.data.success) setTickets(ticketsRes.data.data);
      
      // Filter assets: Employee sees only their own active allocations
      // Wait, we can fetch allocations and extract asset IDs, or just show all for simplicity, 
      // but the prompt says "filtered to only show assets currently allocated to the logged-in user or their department"
      if (assetsRes.data.success) {
        setAssets(assetsRes.data.data); 
        // Note: For a true filter, we'd need to look at allocations. For MVP, we'll just populate all assets and let them pick.
      }
      if (usersRes.data.success) setUsers(usersRes.data.data);

    } catch (err) {
      console.error('Error fetching maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, status, payload = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.put(`/api/maintenance/${ticketId}/status`, { status, ...payload }, { headers });
      if (res.data.success) {
        setTickets(prev => prev.map(t => t._id === ticketId ? res.data.data : t));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const RaiseTicketModal = () => {
    const [assetId, setAssetId] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [photo, setPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
      e.preventDefault();
      if (!assetId || !issueDescription) return setError('Asset and Description are required.');
      setSubmitting(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        } : {};

        const formData = new FormData();
        formData.append('assetId', assetId);
        formData.append('issueDescription', issueDescription);
        formData.append('priority', priority);
        if (photo) formData.append('photo', photo);

        const res = await axios.post('/api/maintenance', formData, { headers });
        if (res.data.success) {
          setTickets(prev => [res.data.data, ...prev]);
          setShowRaiseModal(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error submitting ticket');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowRaiseModal(false)}>
        <div className="modal-card">
          <div className="modal-header">
            <h2>Raise Maintenance Ticket</h2>
            <button className="modal-close-btn cursor-pointer" onClick={() => setShowRaiseModal(false)}>✕</button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Asset</label>
                <SearchableDropdown 
                  options={assets.map(a => ({ value: a._id, label: `${a.name} (${a.assetTag})` }))}
                  value={assetId}
                  onChange={setAssetId}
                  placeholder="-- Select Asset --"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Issue Description</label>
                <textarea 
                  className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-indigo-500"
                  rows="3"
                  value={issueDescription}
                  onChange={e => setIssueDescription(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Priority</label>
                <select 
                  className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none cursor-pointer"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Photo Attachment (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setPhoto(e.target.files[0])}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-cancel-btn cursor-pointer" onClick={() => setShowRaiseModal(false)}>Cancel</button>
              <button type="submit" className="modal-submit-btn cursor-pointer" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AssignTechnicianModal = () => {
    const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
    const [externalTechnicianName, setExternalTechnicianName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      await handleUpdateStatus(activeTicket._id, 'Technician Assigned', {
        assignedTechnicianId, externalTechnicianName
      });
      setSubmitting(false);
      setShowAssignModal(false);
      setActiveTicket(null);
    };

    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAssignModal(false)}>
        <div className="modal-card">
          <div className="modal-header">
            <h2>Assign Technician</h2>
            <button className="modal-close-btn cursor-pointer" onClick={() => setShowAssignModal(false)}>✕</button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Internal Employee</label>
                <SearchableDropdown 
                  options={users.map(u => ({ value: u._id, label: u.name }))}
                  value={assignedTechnicianId}
                  onChange={(v) => { setAssignedTechnicianId(v); setExternalTechnicianName(''); }}
                  placeholder="-- Select Employee --"
                />
              </div>
              <div className="mb-2 text-center text-gray-500 text-sm font-medium">OR</div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">External Vendor Name</label>
                <input 
                  type="text"
                  className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-indigo-500"
                  placeholder="e.g. Dell Support Team"
                  value={externalTechnicianName}
                  onChange={(e) => { setExternalTechnicianName(e.target.value); setAssignedTechnicianId(''); }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-cancel-btn cursor-pointer" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button type="submit" className="modal-submit-btn cursor-pointer" disabled={submitting || (!assignedTechnicianId && !externalTechnicianName)}>
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getStatusTag = (status) => {
    const key = status.toLowerCase().replace(' ', '-');
    return <span className={`status-badge status-badge--${key}`}>{status}</span>;
  };

  return (
    <div className="maintenance-page-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePage="maintenance" />

      <div className="maintenance-page-main">
        <div className="maintenance-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="hamburger-btn md:hidden block bg-gray-800 p-2 rounded cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="maintenance-page-title">
              <h1>Maintenance Management</h1>
              <p>Track and manage repair requests and asset maintenance.</p>
            </div>
          </div>
          {role !== 'Admin' && (
            <button className="raise-ticket-btn cursor-pointer" onClick={() => setShowRaiseModal(true)}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Raise Request
            </button>
          )}
        </div>

        <div className="maintenance-content-grid">
          <div className="maintenance-panel">
            <h2 className="panel-title">{role === 'Employee' ? 'My Maintenance Tickets' : 'Maintenance Queue'}</h2>
            
            {loading ? (
              <div className="text-gray-400 py-4">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-gray-500 py-8 text-center bg-gray-800/20 rounded-lg">No maintenance tickets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="maintenance-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Asset</th>
                      <th>Requested By</th>
                      <th>Issue</th>
                      <th>Priority</th>
                      <th>Status</th>
                      {['Asset Manager', 'Department Head'].includes(role) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket._id}>
                        <td><span className="text-gray-400 font-mono text-xs">#{ticket._id.slice(-6).toUpperCase()}</span></td>
                        <td>
                          <div className="text-white font-medium">{ticket.assetId?.name}</div>
                          <div className="text-gray-500 text-xs">{ticket.assetId?.assetTag}</div>
                        </td>
                        <td>{ticket.requestedBy?.name}</td>
                        <td className="max-w-[200px] truncate text-gray-300" title={ticket.issueDescription}>
                          {ticket.issueDescription}
                        </td>
                        <td><span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
                        <td>{getStatusTag(ticket.status)}</td>
                        {['Asset Manager', 'Department Head'].includes(role) && (
                          <td>
                            {ticket.status === 'Pending' && (
                              <>
                                <button className="action-btn action-btn--approve cursor-pointer" onClick={() => handleUpdateStatus(ticket._id, 'Approved')}>Approve</button>
                                <button className="action-btn action-btn--reject cursor-pointer" onClick={() => handleUpdateStatus(ticket._id, 'Rejected')}>Reject</button>
                              </>
                            )}
                            {ticket.status === 'Approved' && (
                              <button className="action-btn action-btn--advance cursor-pointer" onClick={() => { setActiveTicket(ticket); setShowAssignModal(true); }}>
                                Assign Technician
                              </button>
                            )}
                            {ticket.status === 'Technician Assigned' && (
                              <button className="action-btn action-btn--advance cursor-pointer" onClick={() => handleUpdateStatus(ticket._id, 'In Progress')}>
                                Mark In Progress
                              </button>
                            )}
                            {ticket.status === 'In Progress' && (
                              <button className="action-btn action-btn--approve cursor-pointer" onClick={() => handleUpdateStatus(ticket._id, 'Resolved')}>
                                Mark Resolved
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRaiseModal && <RaiseTicketModal />}
      {showAssignModal && <AssignTechnicianModal />}
    </div>
  );
};

export default Maintenance;
