import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './ResourceBooking.css';

/* ── Hourly timeline definition (9:00 to 17:00) ── */
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const formatHour = (h) => {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
};

const getStatusClass = (status) => {
  const key = status?.toLowerCase() || 'upcoming';
  return `booking-status-tag booking-status-tag--${key}`;
};

/* ── Booking Modal Component ── */
const BookingModal = ({ resource, onClose, onCreated, selectedDate }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConflict(null);

    // Parse times
    const startStr = `${selectedDate}T${startTime}:00`;
    const endStr = `${selectedDate}T${endTime}:00`;
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (end <= start) {
      return setError('End time must be after start time.');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const payload = {
        assetId: resource._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        purpose
      };

      const res = await axios.post('/api/bookings', payload, { headers });
      if (res.data.success) {
        onCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create booking.';
      setError(msg);
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        setConflict(err.response.data.conflict);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>Book {resource.name}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {error && (
              <div className="modal-error">
                <strong>Error: </strong>{error}
              </div>
            )}

            {conflict && (
              <div className="booking-card--conflict" style={{ marginTop: 4, marginBottom: 12 }}>
                <div className="booking-card--conflict-title">Overlap Conflict Encountered</div>
                <div className="booking-card--conflict-text">
                  This resource is already booked by another reservation during the requested period. Please pick a different slot.
                </div>
              </div>
            )}

            <div className="modal-form-group">
              <label>Date</label>
              <input className="modal-input" type="date" value={selectedDate} disabled />
            </div>

            <div className="modal-grid" style={{ marginTop: 12 }}>
              <div className="modal-form-group">
                <label>Start Time</label>
                <input 
                  className="modal-input" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required 
                />
              </div>
              <div className="modal-form-group">
                <label>End Time</label>
                <input 
                  className="modal-input" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="modal-form-group" style={{ marginTop: 12 }}>
              <label>Purpose / Team Info</label>
              <input 
                className="modal-input" 
                placeholder="e.g. Procurement Team Sync" 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? 'Confirming...' : 'Book Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Reschedule Modal Component ── */
const RescheduleModal = ({ booking, onClose, onUpdated }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (booking) {
      const s = new Date(booking.startTime);
      const e = new Date(booking.endTime);
      
      const pad = (n) => String(n).padStart(2, '0');
      setStartTime(`${pad(s.getHours())}:${pad(s.getMinutes())}`);
      setEndTime(`${pad(e.getHours())}:${pad(e.getMinutes())}`);
    }
  }, [booking]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConflict(null);

    const baseDate = booking.startTime.split('T')[0];
    const startStr = `${baseDate}T${startTime}:00`;
    const endStr = `${baseDate}T${endTime}:00`;
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (end <= start) {
      return setError('End time must be after start time.');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.patch(`/api/bookings/${booking._id}/reschedule`, {
        startTime: start.toISOString(),
        endTime: end.toISOString()
      }, { headers });

      if (res.data.success) {
        onUpdated(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reschedule.';
      setError(msg);
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        setConflict(err.response.data.conflict);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>Reschedule Booking</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {error && (
              <div className="modal-error">
                <strong>Error: </strong>{error}
              </div>
            )}

            {conflict && (
              <div className="booking-card--conflict" style={{ marginTop: 4, marginBottom: 12 }}>
                <div className="booking-card--conflict-title">Overlap Conflict Encountered</div>
                <div className="booking-card--conflict-text">
                  Another reservation occupies this period. Please choose a different slot.
                </div>
              </div>
            )}

            <div className="modal-grid">
              <div className="modal-form-group">
                <label>New Start Time</label>
                <input 
                  className="modal-input" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required 
                />
              </div>
              <div className="modal-form-group">
                <label>New End Time</label>
                <input 
                  className="modal-input" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: 12 }}>
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? 'Rescheduling...' : 'Apply Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN RESOURCE BOOKING COMPONENT
══════════════════════════════════════════ */
const ResourceBooking = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bookings, setBookings] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [activeRescheduleBooking, setActiveRescheduleBooking] = useState(null);

  // Fetch bookable resources on mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/bookings/resources', { headers });
        if (res.data.success) {
          setResources(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedResourceId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load resources', err);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, []);

  // Fetch bookings whenever selected resource or date changes
  useEffect(() => {
    if (!selectedResourceId) return;

    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/bookings?assetId=${selectedResourceId}&date=${selectedDate}`, { headers });
        if (res.data.success) {
          setBookings(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load bookings', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [selectedResourceId, selectedDate]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.patch(`/api/bookings/${bookingId}/cancel`, {}, { headers });
      if (res.data.success) {
        // Update local list
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'Cancelled' } : b));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const handleBookingCreated = (newBooking) => {
    setBookings(prev => [...prev, newBooking].sort((a,b) => new Date(a.startTime) - new Date(b.startTime)));
  };

  const handleBookingUpdated = (updatedBooking) => {
    setBookings(prev => prev.map(b => b._id === updatedBooking._id ? updatedBooking : b).sort((a,b) => new Date(a.startTime) - new Date(b.startTime)));
  };

  // Find active resource model
  const activeResource = resources.find(r => r._id === selectedResourceId);

  // Group bookings by hour for layout
  const getBookingsForHour = (hour) => {
    return bookings.filter(b => {
      if (b.status === 'Cancelled') return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      
      // Slot hours match if the booking overlaps with this hourly range [hour, hour+1]
      // Start is at or before the hour-end AND End is after the hour-start
      const sHour = start.getHours();
      const eHour = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
      return sHour <= hour && eHour > hour;
    });
  };

  return (
    <div className="booking-page-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="booking-page-main">
        {/* ── Header ── */}
        <div className="booking-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
            <div className="booking-page-title">
              <h1>Resource Booking</h1>
              <p>Time-slot booking of shared resources with no overlaps</p>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="booking-content-grid">
          {/* Left panel */}
          <div className="booking-selector-panel">
            <div className="selector-group">
              <label>Select Resource</label>
              {loadingResources ? (
                <div style={{ color: '#64748B', fontSize: 13 }}>Loading resources...</div>
              ) : (
                <select 
                  className="selector-select" 
                  value={selectedResourceId} 
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                >
                  {resources.length === 0 && <option value="">No shared resources found</option>}
                  {resources.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.assetTag})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="selector-group">
              <label>Select Date</label>
              <input 
                className="selector-input" 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
              />
            </div>

            <button 
              className="book-slot-btn" 
              onClick={() => setShowBookingModal(true)}
              disabled={!selectedResourceId}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Book a slot
            </button>
          </div>

          {/* Right panel - Timeline / Schedule */}
          <div className="booking-calendar-panel">
            <div className="panel-header">
              <div className="panel-header-title">
                <h2>Timeline Schedule</h2>
                <p>
                  {activeResource ? `${activeResource.name} on ` : ''}
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {loadingBookings ? (
              <div className="booking-loading">
                <div className="spinner" />
                Loading timeline...
              </div>
            ) : !selectedResourceId ? (
              <div className="booking-empty-state">
                <p>Register some assets as "Shared / Bookable Resource" first to book slots.</p>
              </div>
            ) : (
              <div className="timeline-container">
                {HOURS.map(hour => {
                  const hourBookings = getBookingsForHour(hour);

                  return (
                    <div key={hour} className="timeline-row">
                      <div className="timeline-time">
                        {formatHour(hour)}
                      </div>
                      <div className="timeline-slot-content">
                        {hourBookings.length === 0 ? (
                          <div style={{ color: '#334155', fontSize: 13, fontStyle: 'italic', paddingTop: 6 }}>
                            — Available
                          </div>
                        ) : (
                          hourBookings.map(b => {
                            const start = new Date(b.startTime);
                            const end = new Date(b.endTime);
                            const timeString = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                            
                            return (
                              <div key={b._id} className="booking-card">
                                <div className="booking-card-info">
                                  <div className="booking-card-title">
                                    Booked - {b.purpose || 'Reserved Room Slot'}
                                  </div>
                                  <div className="booking-card-time">
                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    {timeString}
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                                    <span className="booking-card-user">
                                      {b.bookedBy?.name || 'User'}
                                    </span>
                                    <span className={getStatusClass(b.status)}>
                                      {b.status}
                                    </span>
                                  </div>
                                </div>

                                <div className="booking-card-actions">
                                  {b.status !== 'Completed' && b.status !== 'Cancelled' && (
                                    <>
                                      <button 
                                        className="action-btn action-btn--edit" 
                                        onClick={() => {
                                          setActiveRescheduleBooking(b);
                                          setShowRescheduleModal(true);
                                        }}
                                        title="Reschedule"
                                      >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/>
                                        </svg>
                                      </button>
                                      <button 
                                        className="action-btn action-btn--cancel" 
                                        onClick={() => handleCancelBooking(b._id)}
                                        title="Cancel"
                                      >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                                        </svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Booking Modal ── */}
      {showBookingModal && activeResource && (
        <BookingModal 
          resource={activeResource}
          selectedDate={selectedDate}
          onClose={() => setShowBookingModal(false)}
          onCreated={handleBookingCreated}
        />
      )}

      {/* ── Reschedule Modal ── */}
      {showRescheduleModal && activeRescheduleBooking && (
        <RescheduleModal 
          booking={activeRescheduleBooking}
          onClose={() => {
            setShowRescheduleModal(false);
            setActiveRescheduleBooking(null);
          }}
          onUpdated={handleBookingUpdated}
        />
      )}
    </div>
  );
};

export default ResourceBooking;
