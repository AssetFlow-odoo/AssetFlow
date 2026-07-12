import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './Assets.css';

/* ── Status badge helper ── */
const StatusBadge = ({ status }) => {
  const map = {
    'Available':        'available',
    'Allocated':        'allocated',
    'Under Maintenance':'maintenance',
    'Reserved':         'reserved',
    'Lost':             'lost',
    'Retired':          'retired',
    'Disposed':         'disposed',
  };
  const key = map[status] || 'available';
  return <span className={`status-badge status-badge--${key}`}>{status}</span>;
};

/* ── Filter Dropdown ── */
const FilterDropdown = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find(o => o.value === selected);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className={`filter-btn${open ? ' active' : ''}`} onClick={() => setOpen(v => !v)}>
        {current?.label || label}
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="filter-dropdown">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`filter-dropdown-item${selected === opt.value ? ' selected' : ''}`}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Register Asset Modal ── */
const RegisterModal = ({ categories, onClose, onCreated }) => {
  const [form, setForm] = useState({
    assetTag: '', name: '', categoryId: '', serialNumber: '',
    acquisitionDate: '', acquisitionCost: '', condition: 'Good',
    location: '', status: 'Available', isSharedBookable: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.assetTag || !form.name || !form.categoryId) {
      return setError('Asset Tag, Name, and Category are required.');
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        ...form,
        acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
        acquisitionDate: form.acquisitionDate || undefined,
      };
      const res = await axios.post('/api/assets', payload, { headers });
      if (res.data.success) {
        onCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create asset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>Register New Asset</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-grid">
              <div className="modal-form-group">
                <label>Asset Tag *</label>
                <input className="modal-input" name="assetTag" value={form.assetTag} onChange={onChange} placeholder="e.g. AF-LPT-002" required />
              </div>
              <div className="modal-form-group">
                <label>Name *</label>
                <input className="modal-input" name="name" value={form.name} onChange={onChange} placeholder="e.g. Dell Latitude 7420" required />
              </div>
              <div className="modal-form-group">
                <label>Category *</label>
                <select className="modal-select" name="categoryId" value={form.categoryId} onChange={onChange} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="modal-form-group">
                <label>Serial Number</label>
                <input className="modal-input" name="serialNumber" value={form.serialNumber} onChange={onChange} placeholder="e.g. C02XG2ABCD" />
              </div>
              <div className="modal-form-group">
                <label>Location</label>
                <input className="modal-input" name="location" value={form.location} onChange={onChange} placeholder="e.g. HQ Floor 2" />
              </div>
              <div className="modal-form-group">
                <label>Status</label>
                <select className="modal-select" name="status" value={form.status} onChange={onChange}>
                  {['Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="modal-form-group">
                <label>Acquisition Date</label>
                <input className="modal-input" type="date" name="acquisitionDate" value={form.acquisitionDate} onChange={onChange} />
              </div>
              <div className="modal-form-group">
                <label>Acquisition Cost (₹)</label>
                <input className="modal-input" type="number" name="acquisitionCost" value={form.acquisitionCost} onChange={onChange} placeholder="e.g. 75000" />
              </div>
              <div className="modal-form-group">
                <label>Condition</label>
                <select className="modal-select" name="condition" value={form.condition} onChange={onChange}>
                  {['New','Good','Fair','Poor','Damaged'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="modal-form-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox" id="isSharedBookable"
                  name="isSharedBookable"
                  checked={form.isSharedBookable}
                  onChange={onChange}
                  style={{ accentColor: '#6366F1', width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="isSharedBookable" style={{ textTransform: 'none', fontSize: 13, color: '#94A3B8', cursor: 'pointer', letterSpacing: 0 }}>
                  Shared / Bookable Resource
                </label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN ASSETS PAGE
══════════════════════════════════════════ */
const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Available', label: 'Available' },
  { value: 'Allocated', label: 'Allocated' },
  { value: 'Under Maintenance', label: 'Maintenance' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Lost', label: 'Lost' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Disposed', label: 'Disposed' },
];

const Assets = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [assets, setAssets]             = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [showModal, setShowModal]       = useState(false);
  const searchTimeout                   = useRef(null);

  // Build category filter options dynamically
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(c => ({ value: c._id, label: c.name }))
  ];

  const fetchAssets = useCallback(async (searchVal, catVal, statVal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = {};
      if (searchVal) params.search = searchVal;
      if (catVal && catVal !== 'all') params.categoryId = catVal;
      if (statVal && statVal !== 'all') params.status = statVal;
      const res = await axios.get('/api/assets', { headers, params });
      if (res.data.success) setAssets(res.data.data);
    } catch (err) {
      console.error('Error fetching assets', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/assets/categories', { headers });
        if (res.data.success) setCategories(res.data.data);
      } catch (err) {
        console.error('Error fetching categories', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch assets on mount and filter changes
  useEffect(() => {
    fetchAssets(search, categoryFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter]);

  // Debounced search
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchAssets(val, categoryFilter, statusFilter);
    }, 350);
  };

  const handleAssetCreated = (newAsset) => {
    setAssets(prev => [newAsset, ...prev]);
  };

  return (
    <div className="assets-page-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activePage="assets" />

      <div className="assets-page-main">
        {/* ── Page Header ── */}
        <div className="assets-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Mobile hamburger */}
            <button
              style={{ display: 'none', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="assets-page-title">
              <h1>Asset Directory</h1>
              <p>Asset registrations and directory</p>
            </div>
          </div>
          {localStorage.getItem('userRole') === 'Asset Manager' && (
            <button className="register-asset-btn" onClick={() => setShowModal(true)}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Register Asset
            </button>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div className="assets-toolbar">
          <div className="assets-search-wrap">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="assets-search-input"
              type="text"
              placeholder="Search by tag, serial, or name..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <FilterDropdown
            label="Category"
            options={categoryOptions}
            selected={categoryFilter}
            onSelect={setCategoryFilter}
          />
          <FilterDropdown
            label="Status"
            options={STATUSES}
            selected={statusFilter}
            onSelect={setStatusFilter}
          />
        </div>

        {/* ── Table ── */}
        <div className="assets-table-container">
          {loading ? (
            <div className="assets-loading">
              <div className="spinner" />
              Loading assets...
            </div>
          ) : assets.length === 0 ? (
            <div className="assets-empty-state">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <p>No assets found. {search || categoryFilter !== 'all' || statusFilter !== 'all' ? 'Try clearing your filters.' : 'Click "Register Asset" to add your first asset.'}</p>
            </div>
          ) : (
            <table className="assets-table">
              <thead>
                <tr>
                  <th>TAG</th>
                  <th>NAME</th>
                  <th>CATEGORY</th>
                  <th>STATUS</th>
                  <th>LOCATION</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset._id}>
                    <td><span className="asset-tag-cell">{asset.assetTag}</span></td>
                    <td>{asset.name}</td>
                    <td>{asset.categoryId?.name || '—'}</td>
                    <td><StatusBadge status={asset.status} /></td>
                    <td>{asset.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Register Asset Modal ── */}
      {showModal && (
        <RegisterModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onCreated={handleAssetCreated}
        />
      )}
    </div>
  );
};

export default Assets;
