import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './Dashboard.css'; // Reusing the layout styles
import './OrganizationSetup.css'; // Specific styles for this page

const OrganizationSetup = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Departments');
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'Department' or 'Category'
  
  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', departmentHeadId: '', parentDepartmentId: '', status: 'Active' });
  const [catForm, setCatForm] = useState({ name: '' });

  const fetchData = async () => {
    try {
      if (activeTab === 'Departments') {
        const res = await axios.get('/api/departments');
        setDepartments(res.data.data);
      } else if (activeTab === 'Categories') {
        const res = await axios.get('/api/categories');
        setCategories(res.data.data);
      } else if (activeTab === 'Employee') {
        const res = await axios.get('/api/users');
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAddClick = () => {
    if (activeTab === 'Employee') return; // Hide button for Employee
    setModalType(activeTab === 'Departments' ? 'Department' : 'Category');
    setShowAddModal(true);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/departments', deptForm);
      setShowAddModal(false);
      setDeptForm({ name: '', departmentHeadId: '', parentDepartmentId: '', status: 'Active' });
      fetchData(); // refresh list
    } catch (err) {
      console.error('Failed to create department', err);
      alert('Error creating department');
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/categories', catForm);
      setShowAddModal(false);
      setCatForm({ name: '' });
      fetchData(); // refresh list
    } catch (err) {
      console.error('Failed to create category', err);
      alert('Error creating category');
    }
  };

  const handlePromote = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      fetchData(); // refresh list
    } catch (err) {
      console.error('Failed to update role', err);
      alert('Error updating role');
    }
  };

  return (
    <div className="db-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="db-main">
        <main className="db-content mt-4">
          <div className="mb-6 flex items-center gap-4">
            {/* Mobile hamburger menu button */}
            <button className="hamburger-btn md:hidden block bg-gray-800 p-2 rounded" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Organization setup</h1>
          </div>

          <div className="org-setup-content">
            <div className="org-setup-header">
              <div className="org-setup-tabs">
                <button 
                  className={`org-tab-btn ${activeTab === 'Departments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Departments')}
                >
                  Departments
                </button>
                <button 
                  className={`org-tab-btn ${activeTab === 'Categories' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Categories')}
                >
                  Categories
                </button>
                <button 
                  className={`org-tab-btn ${activeTab === 'Employee' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Employee')}
                >
                  Employee
                </button>
              </div>
              
              {activeTab !== 'Employee' && (
                <button className="org-add-btn" onClick={handleAddClick}>
                  + Add
                </button>
              )}
            </div>

            {/* DEPARTMENTS TABLE */}
            {activeTab === 'Departments' && (
              <div className="org-table-container">
                <table className="org-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Head</th>
                      <th>Parent Dept</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.length === 0 ? (
                       <tr><td colSpan="4" className="text-center">No departments found.</td></tr>
                    ) : (
                      departments.map((dept) => (
                        <tr key={dept._id}>
                          <td>{dept.name}</td>
                          <td>{dept.departmentHeadId ? dept.departmentHeadId.name : '--'}</td>
                          <td>{dept.parentDepartmentId ? dept.parentDepartmentId.name : '--'}</td>
                          <td>
                            <span className={`status-pill ${dept.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                              {dept.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* CATEGORIES TABLE */}
            {activeTab === 'Categories' && (
              <div className="org-table-container">
                <table className="org-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Custom Fields Count</th>
                      <th>Asset Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                       <tr><td colSpan="3" className="text-center">No categories found.</td></tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat._id}>
                          <td>{cat.name}</td>
                          <td>{cat.customFields ? cat.customFields.length : 0}</td>
                          <td>{cat.assetCount || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* EMPLOYEES TABLE */}
            {activeTab === 'Employee' && (
              <div className="org-table-container">
                <table className="org-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                       <tr><td colSpan="4" className="text-center">No employees found.</td></tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp._id}>
                          <td>{emp.name}</td>
                          <td>{emp.email}</td>
                          <td>
                            <span className={`status-pill ${emp.role === 'Admin' ? 'status-active' : 'status-inactive'}`} style={{ color: '#E2E8F0', borderColor: '#475569', backgroundColor: 'transparent'}}>
                              {emp.role}
                            </span>
                          </td>
                          <td>
                            {emp.role !== 'Admin' && (
                              <select 
                                className="bg-gray-800 text-white text-sm rounded border border-gray-600 p-1 outline-none"
                                value={emp.role}
                                onChange={(e) => handlePromote(emp._id, e.target.value)}
                              >
                                <option value="Employee">Employee</option>
                                <option value="Department Head">Promote to Dept Head</option>
                                <option value="Asset Manager">Promote to Asset Mgr</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#131826] border border-gray-700 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add New {modalType}</h2>
            
            {modalType === 'Department' && (
              <form onSubmit={handleDeptSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Department Name</label>
                  <input required type="text" className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-green-500"
                    value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Head (User ID)</label>
                  <input type="text" placeholder="Optional User ID" className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-green-500"
                    value={deptForm.departmentHeadId} onChange={e => setDeptForm({...deptForm, departmentHeadId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Parent Dept (Dept ID)</label>
                  <input type="text" placeholder="Optional Dept ID" className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-green-500"
                    value={deptForm.parentDepartmentId} onChange={e => setDeptForm({...deptForm, parentDepartmentId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-green-500"
                    value={deptForm.status} onChange={e => setDeptForm({...deptForm, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                  <button type="submit" className="org-add-btn">Save</button>
                </div>
              </form>
            )}

            {modalType === 'Category' && (
              <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category Name</label>
                  <input required type="text" className="w-full bg-[#0F1117] border border-gray-700 rounded p-2 text-white outline-none focus:border-green-500"
                    value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                  <button type="submit" className="org-add-btn">Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default OrganizationSetup;
