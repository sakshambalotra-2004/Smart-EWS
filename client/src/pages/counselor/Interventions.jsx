import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

const STATUS_COLORS = { Scheduled: 'var(--accent)', Active: 'var(--medium)', Completed: 'var(--low)' };

export default function CounselorInterventions() {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const load = () => API.get('/counselor/interventions').then(r => setInterventions(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdating(id);
    try {
      await API.put(`/counselor/interventions/${id}`, { status });
      load();
    } catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const filtered = interventions.filter(i => filter === 'all' || i.status === filter);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header-row">
          <div className="page-header" style={{ margin: 0 }}>
            <h2>Interventions</h2>
            <p>{interventions.length} total interventions</p>
          </div>
          <div className="tabs" style={{ margin: 0, width: 'auto' }}>
            {['all','Scheduled','Active','Completed'].map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} style={{ flex: 'none', padding: '6px 14px' }} onClick={() => setFilter(f)}>
                {f} <span style={{ opacity: 0.6, fontSize: 11, fontFamily: 'var(--mono)', marginLeft: 4 }}>
                  {f === 'all' ? interventions.length : interventions.filter(i => i.status === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {loading ? <div className="spinner" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(inv => (
                <div className="card card-sm" key={inv._id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{inv.student?.name || inv.student_id}</span>
                      <span className="tag">{inv.student_id}</span>
                      <span style={{ fontSize: 12, color: STATUS_COLORS[inv.status], fontWeight: 600 }}>● {inv.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, background: 'var(--surface2)', padding: '2px 10px', borderRadius: 20, color: 'var(--accent)' }}>{inv.type}</span>
                      {inv.scheduled_date && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          📅 {new Date(inv.scheduled_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {inv.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{inv.notes}</p>}
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                      By {inv.counselor_id?.name || 'Counselor'} · {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 100 }}>
                    {inv.status !== 'Active' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleStatusUpdate(inv._id, 'Active')} disabled={updating === inv._id}>
                        Set Active
                      </button>
                    )}
                    {inv.status !== 'Completed' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(inv._id, 'Completed')} disabled={updating === inv._id}>
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="empty-state card">
                  <div style={{ fontSize: 32 }}>📋</div>
                  <p style={{ marginTop: 12 }}>No interventions {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Create them from the Risk Analysis page.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
