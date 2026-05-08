import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Briefcase, Calendar, X, Trash2, Edit, ChevronUp, ChevronDown, Filter, ExternalLink } from 'lucide-react';
import { type Application } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/applications';

function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof Application>('date_applied');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    company: '',
    position: '',
    status: 'Applied',
    date_applied: new Date().toISOString().split('T')[0],
    notes: '',
    job_link: ''
  });

  const fetchApplications = async () => {
    try {
      const response = await axios.get(API_URL);
      setApplications(response.data);
    } catch {
      // Intentionally ignored
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApplications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }

      fetchApplications();
      closeModal();
    } catch {
      // Intentionally ignored
    }
  };

  const confirmDelete = (id: string) => {
    setApplicationToDelete(id);
  };

  const executeDelete = async () => {
    if (!applicationToDelete) return;
    try {
      await axios.delete(`${API_URL}/${applicationToDelete}`);
      fetchApplications();
    } catch {
      // Intentionally ignored
    } finally {
      setApplicationToDelete(null);
    }
  };

  const openModal = (app?: Application) => {
    if (app) {
      setFormData({
        company: app.company,
        position: app.position,
        status: app.status,
        date_applied: app.date_applied,
        notes: app.notes || '',
        job_link: app.job_link || ''
      });
      setEditingId(app._id);
    } else {
      setFormData({
        company: '',
        position: '',
        status: 'Applied',
        date_applied: new Date().toISOString().split('T')[0],
        notes: '',
        job_link: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const getStatusClass = (status: string) => {
    return `status-badge status-${status.toLowerCase()}`;
  };

  const handleSort = (field: keyof Application) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: keyof Application) => {
    if (sortField !== field) return <ChevronDown size={16} style={{ opacity: 0.2 }} />;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'All') return true;
    return app.status === filterStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const valA = (a[sortField] || '').toLowerCase();
    const valB = (b[sortField] || '').toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = sortedApplications.slice(startIndex, startIndex + itemsPerPage);



  return (
    <div>
      <header className="app-header">
        <div>
          <h1 className="app-title">Job Application Tracker</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track and manage your job search journey.</p>
        </div>
        <button className="btn" onClick={() => openModal()}>
          <Plus size={20} />
          New Application
        </button>
      </header>

      {applications.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 500, marginRight: '0.5rem' }}>
            <Filter size={18} />
          </div>
          {['All', 'Applied', 'Interviewing', 'Offered', 'Rejected'].map(status => {
            const count = status === 'All' 
              ? applications.length 
              : applications.filter(app => app.status === status).length;
              
            return (
              <button
                key={status}
                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: filterStatus === status ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                  background: filterStatus === status ? 'rgba(217, 119, 6, 0.1)' : 'var(--card-bg)',
                  color: filterStatus === status ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: filterStatus === status ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  outline: 'none'
                }}
              >
                {status === 'All' ? 'All' : status}
                <span style={{ 
                  background: filterStatus === status ? 'var(--primary)' : 'var(--card-border)', 
                  color: filterStatus === status ? 'var(--bg-main)' : 'var(--text-muted)',
                  padding: '0.1rem 0.5rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Briefcase size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>No applications yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Start tracking your job search by adding your first application.</p>
          <button className="btn" onClick={() => openModal()}>Add Application</button>
        </div>
      ) : sortedApplications.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>No matches found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try changing your filter criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('company')}>
                  <div className="th-content">Company {renderSortIcon('company')}</div>
                </th>
                <th onClick={() => handleSort('position')}>
                  <div className="th-content">Position {renderSortIcon('position')}</div>
                </th>
                <th onClick={() => handleSort('status')}>
                  <div className="th-content">Status {renderSortIcon('status')}</div>
                </th>
                <th onClick={() => handleSort('job_link')}>
                  <div className="th-content">Job Link {renderSortIcon('job_link')}</div>
                </th>
                <th onClick={() => handleSort('date_applied')}>
                  <div className="th-content">Date Applied {renderSortIcon('date_applied')}</div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApplications.map((app) => (
                <tr key={app._id}>
                  <td style={{ fontWeight: 500 }}>{app.company}</td>
                  <td>{app.position}</td>
                  <td>
                    <span className={getStatusClass(app.status)}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    {app.job_link ? (
                      <a href={app.job_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title={app.job_link}>
                        <ExternalLink size={14} />
                        {app.job_link.length > 20 ? app.job_link.substring(0, 20) + '...' : app.job_link}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      {app.date_applied}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" className="btn" style={{ padding: '0.4rem', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--text-main)' }} onClick={() => openModal(app)} title="Edit">
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedApplications.length)} of {sortedApplications.length} entries
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn" 
                  style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--card-border)', padding: '0.4rem 0.8rem' }}
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  className="btn" 
                  style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--card-border)', padding: '0.4rem 0.8rem' }}
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Application' : 'New Application'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Position</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Job Posting Link</label>
                <input
                  type="text"
                  className="input"
                  value={formData.job_link}
                  onChange={e => setFormData({ ...formData, job_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Status</label>
                  <select
                    className="select"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Date Applied</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={formData.date_applied}
                    onChange={e => setFormData({ ...formData, date_applied: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Notes</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <div>
                  {editingId && (
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => {
                        closeModal();
                        confirmDelete(editingId);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} style={{ marginRight: '0.4rem' }} />
                      Delete
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--text-main)' }} onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn">{editingId ? 'Save Changes' : 'Add Application'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {applicationToDelete && (
        <div className="modal-overlay" onClick={() => setApplicationToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Confirm Delete</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to delete this application? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--card-border)' }} onClick={() => setApplicationToDelete(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
