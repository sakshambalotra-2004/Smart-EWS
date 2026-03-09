import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

const ROLES = ['admin', 'faculty', 'counselor', 'student'];
const roleColor = { admin: '#8b5cf6', faculty: '#0ea5e9', counselor: '#10b981', student: '#f59e0b' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'faculty', dept: 'CS' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => API.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await API.post('/admin/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'faculty', dept: 'CS' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const grouped = ROLES.map(r => ({ role: r, users: users.filter(u => u.role === r) }));

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header-row">
          <div className="page-header" style={{ margin: 0 }}>
            <h2>User Management</h2>
            <p>{users.length} total users across all roles</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
        </div>

        <div style={{ marginTop: 28 }}>
          {loading ? <div className="spinner" /> : grouped.map(g => g.users.length > 0 && (
            <div className="card" key={g.role} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: roleColor[g.role] }} />
                <div className="card-title" style={{ margin: 0, textTransform: 'capitalize' }}>{g.role}s ({g.users.length})</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Dept</th><th>Student ID</th><th>Created</th></tr>
                  </thead>
                  <tbody>
                    {g.users.map(u => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                        <td>{u.dept || '—'}</td>
                        <td>{u.student_id ? <span className="tag">{u.student_id}</span> : '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Add New User</span>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. John Smith' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'john@university.edu' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Minimum 8 characters' },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })}>
                    {['CS','EE','ME','BBA'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
