import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject_code: '', subject_name: '', dept: 'CS', semester: 3, semester_label: 'Spring 2025' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [sRes, uRes] = await Promise.all([
      API.get('/subjects').catch(() => ({ data: [] })),
      API.get('/admin/users').catch(() => ({ data: [] }))
    ]);
    setSubjects(sRes.data);
    setFaculty(uRes.data.filter(u => u.role === 'faculty'));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await API.post('/subjects', form);
      setShowCreate(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleAssign = async (subjectId, facultyId) => {
    await API.put(`/subjects/${subjectId}/assign`, { faculty_id: facultyId }).catch(() => {});
    load();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header-row">
          <div className="page-header" style={{ margin: 0 }}>
            <h2>Subject Management</h2>
            <p>Create subjects and assign faculty members</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add Subject</button>
        </div>

        <div style={{ marginTop: 28 }}>
          <div className="card">
            {loading ? <div className="spinner" /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Code</th><th>Subject Name</th><th>Dept</th><th>Semester</th><th>Assigned Faculty</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {subjects.map(s => (
                      <tr key={s._id}>
                        <td><span className="tag" style={{ fontFamily: 'var(--mono)' }}>{s.subject_code}</span></td>
                        <td style={{ fontWeight: 500 }}>{s.subject_name}</td>
                        <td>{s.dept}</td>
                        <td>Sem {s.semester}</td>
                        <td>
                          {s.faculty_id ? (
                            <span style={{ color: 'var(--low)', fontSize: 13 }}>✓ {s.faculty_id.name}</span>
                          ) : (
                            <span style={{ color: 'var(--high)', fontSize: 13 }}>✗ Unassigned</span>
                          )}
                        </td>
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            value={s.faculty_id?._id || ''}
                            onChange={e => handleAssign(s._id, e.target.value)}
                          >
                            <option value="">-- Assign Faculty --</option>
                            {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No subjects created yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Create Subject</span>
                <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Subject Code</label>
                  <input className="form-input" placeholder="CS301" value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input className="form-input" type="number" min={1} max={8} value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input className="form-input" placeholder="Data Structures" value={form.subject_name} onChange={e => setForm({ ...form, subject_name: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })}>
                    {['CS','EE','ME','BBA'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester Label</label>
                  <input className="form-input" value={form.semester_label} onChange={e => setForm({ ...form, semester_label: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
