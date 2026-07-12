import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

// Custom Searchable Dropdown Component
const SearchableDropdown = ({ options, value, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className={`w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white flex justify-between items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-[#1A1F2E] border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-[#1A1F2E] border-b border-gray-700">
            <input
              type="text"
              className="w-full bg-[#0F1117] text-white border border-gray-600 rounded p-1 text-sm outline-none focus:border-indigo-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
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

const AllocationTransfer = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(localStorage.getItem('userRole') || 'Employee');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [userDeptId, setUserDeptId] = useState(localStorage.getItem('userDeptId') || '');
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [recentAllocations, setRecentAllocations] = useState([]);

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assignedToUser, setAssignedToUser] = useState(role === 'Employee' ? userId : '');
  const [reason, setReason] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // If Dept Head, filter users by departmentId. Otherwise get all (or default depending on role)
      let usersUrl = '/api/users';
      if (role === 'Department Head' && userDeptId) {
        usersUrl += `?departmentId=${userDeptId}`;
      }

      const [assetsRes, usersRes, queueRes, recentRes] = await Promise.all([
        axios.get('/api/assets?forAllocation=true', axiosConfig),
        axios.get(usersUrl, axiosConfig),
        axios.get('/api/allocations/pending', axiosConfig),
        axios.get('/api/allocations/recent', axiosConfig)
      ]);
      
      setAssets(assetsRes.data.data);
      setUsers(usersRes.data.data);
      setQueue(queueRes.data.data);
      setRecentAllocations(recentRes.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch initial data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = (assetId) => {
    setSelectedAssetId(assetId);
    if (assetId) {
      const asset = assets.find(a => a._id === assetId);
      setSelectedAsset(asset);
    } else {
      setSelectedAsset(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedAssetId) {
      return setError('Please select an asset first.');
    }

    try {
      setLoading(true);
      const payload = {
        assetId: selectedAssetId,
        assignedToUser: assignedToUser,
        reason,
        expectedReturnDate: expectedReturnDate || undefined
      };

      await axios.post('/api/allocations/request', payload, axiosConfig);
      
      setSuccess('Request submitted successfully!');
      
      // Reset form
      setSelectedAssetId('');
      setSelectedAsset(null);
      setReason('');
      setExpectedReturnDate('');
      if (role !== 'Employee') setAssignedToUser('');
      
      // Refresh queue
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await axios.put(`/api/allocations/${id}/approve`, {}, axiosConfig);
      fetchData(); // Refresh queue and assets
    } catch (err) {
      alert('Error approving request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setLoading(true);
      await axios.put(`/api/allocations/${id}/reject`, {}, axiosConfig);
      fetchData(); // Refresh queue
    } catch (err) {
      alert('Error rejecting request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const assetOptions = assets.map(a => ({
    value: a._id,
    label: `${a.name} (${a.assetTag}) - ${a.status}`
  }));

  const userOptions = users.map(u => ({
    value: u._id,
    label: `${u.name} (${u.role})`
  }));

  return (
    <div className="db-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="db-main">
        <main className="db-content mt-4 p-6 overflow-y-auto">
          <div className="mb-6 flex items-center gap-4">
            <button className="hamburger-btn md:hidden block bg-gray-800 p-2 rounded cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Asset Allocation & Transfer</h1>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Request Form Area (Hidden for Admins) */}
            {role !== 'Admin' && (
              <div className="bg-[#131826] border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {selectedAsset?.status === 'Allocated' ? 'Transfer Request' : (role === 'Employee' ? 'Asset Allocation Request' : 'Asset Allocation')}
                </h2>

                {/* Scenario B Warning */}
                {selectedAsset?.status === 'Allocated' && (
                  <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 rounded-lg">
                    <p className="text-red-400 font-medium">
                      Already Allocated to {selectedAsset.currentOwnerName || 'another user'}. 
                      Direct re-allocation is blocked - submit a transfer request below.
                    </p>
                  </div>
                )}

                {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded">{error}</div>}
                {success && <div className="mb-4 text-green-400 text-sm bg-green-400/10 border border-green-400/20 p-3 rounded">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Select Asset</label>
                    <SearchableDropdown 
                      options={assetOptions} 
                      value={selectedAssetId} 
                      onChange={handleAssetSelect} 
                      placeholder="-- Choose an Asset --" 
                    />
                  </div>

                  {selectedAsset && (
                    <>
                      {/* From Field (Only shown in Scenario B) */}
                      {selectedAsset.status === 'Allocated' && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">From (Current Owner)</label>
                          <input 
                            type="text" 
                            disabled 
                            value={selectedAsset.currentOwnerName || 'Unknown'} 
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-400 cursor-not-allowed"
                          />
                        </div>
                      )}

                      {/* To Field */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">To (Requesting User)</label>
                        {role === 'Employee' ? (
                          <input 
                            type="text" 
                            disabled 
                            value={userName} 
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-400 cursor-not-allowed"
                          />
                        ) : (
                          <SearchableDropdown 
                            options={userOptions} 
                            value={assignedToUser} 
                            onChange={setAssignedToUser} 
                            placeholder="-- Select Employee --" 
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Reason for Request</label>
                        <textarea 
                          className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-indigo-500 min-h-[100px]"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          required
                          placeholder="Why do you need this asset?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Expected Return Date (Optional)</label>
                        <input 
                          type="date"
                          className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-gray-300 outline-none focus:border-indigo-500 cursor-pointer"
                          value={expectedReturnDate}
                          onChange={(e) => setExpectedReturnDate(e.target.value)}
                        />
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="cursor-pointer w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {selectedAsset.status === 'Allocated' 
                            ? (['Asset Manager', 'Department Head'].includes(role) ? 'Transfer Asset' : 'Submit Transfer Request')
                            : (['Asset Manager', 'Department Head'].includes(role) ? 'Allocate Asset' : 'Submit Request')}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            )}


            {/* The Zero-State Queue */}
            <div className="bg-[#131826] border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {role === 'Employee' ? 'My Pending Requests' : 'Pending Approvals'}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-sm text-gray-400">
                      <th className="pb-3 pr-4 font-medium">Asset</th>
                      <th className="pb-3 pr-4 font-medium">Requestor / To</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 font-medium">Status</th>
                      {['Asset Manager', 'Department Head'].includes(role) && (
                        <th className="pb-3 font-medium text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {queue.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">
                          No pending requests in the queue.
                        </td>
                      </tr>
                    ) : (
                      queue.map((req) => (
                        <tr key={req._id} className="border-b border-gray-800 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-4 pr-4">
                            <span className="text-white font-medium block">{req.assetId?.name}</span>
                            <span className="text-gray-500 text-xs">{req.assetId?.assetTag}</span>
                          </td>
                          <td className="py-4 pr-4 text-gray-300">
                            {req.allocatedBy?.name} &rarr; {req.assignedToUser?.name}
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${req.type === 'Transfer' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {req.type}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 pr-4 text-gray-400">
                            {req.status}
                          </td>
                          {['Asset Manager', 'Department Head'].includes(role) && (
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => handleApprove(req._id)}
                                className="cursor-pointer px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded mr-2 transition"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleReject(req._id)}
                                className="cursor-pointer px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition"
                              >
                                Reject
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Recent / Your Allocations */}
            <div className="bg-[#131826] border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {role === 'Employee' ? 'Your Allocations' : 'Recent Allocations'}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-sm text-gray-400">
                      <th className="pb-3 pr-4 font-medium">Asset</th>
                      <th className="pb-3 pr-4 font-medium">User</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentAllocations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500">
                          No recent allocations found.
                        </td>
                      </tr>
                    ) : (
                      recentAllocations.map((alloc) => (
                        <tr key={alloc._id} className="border-b border-gray-800 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-4 pr-4">
                            <span className="text-white font-medium block">{alloc.assetId?.name}</span>
                            <span className="text-gray-500 text-xs">{alloc.assetId?.assetTag}</span>
                          </td>
                          <td className="py-4 pr-4 text-gray-300">
                            {alloc.assignedToUser?.name}
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${alloc.type === 'Transfer' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {alloc.type}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-gray-400">
                            {new Date(alloc.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${alloc.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                              {alloc.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AllocationTransfer;
