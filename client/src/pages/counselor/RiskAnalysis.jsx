import { useState, useEffect } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

const INTERVENTION_TYPES = ['Academic Counseling', 'Parent Notification', 'Tutoring Session', 'Peer Mentoring', 'Warning Letter'];

export default function CounselorRiskAnalysis() {
  const [predictions, setPredictions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionForm, setInterventionForm] = useState({ type: INTERVENTION_TYPES[0], notes: '', scheduled_date: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => API.get('/counselor/predictions').then(r => setPredictions(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = predictions.filter(p => filter === 'all' || p.risk_level === filter);

  const handleCreateIntervention = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await API.post('/counselor/interventions', { student_id: selected.student_id, ...interventionForm });
      setShowIntervention(false);
      setSuccessMsg(`Intervention created for ${selected.student?.name || selected.student_id}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const radarData = (p) => p ? [
    { metric: 'Attendance', value: p.features_used?.attendance_avg || 0 },
    { metric: 'CA Avg', value: p.features_used?.ca_avg || 0 },
    { metric: 'Midterm', value: p.features_used?.midterm_avg || 0 },
    { metric: 'CGPA', value: (p.features_used?.past_cgpa || 0) * 25 },
    { metric: 'Risk Score', value: 100 - p.risk_score },
  ] : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header-row">
          <div className="page-header" style={{ margin: 0 }}>
            <h2>Risk Analysis</h2>
            <p>{predictions.length} students assessed</p>
          </div>
          <div className="tabs" style={{ margin: 0, width: 'auto' }}>
            {['all','high','medium','low'].map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} style={{ flex: 'none', padding: '6px 14px' }} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ marginLeft: 6, fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.7 }}>
                  {f === 'all' ? predictions.length : predictions.filter(p => p.risk_level === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {successMsg && <div className="alert alert-success" style={{ marginTop: 16 }}>{successMsg}</div>}

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
          <div className="card">
            {loading ? <div className="spinner" /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Student</th><th>ID</th><th>Risk Level</th><th>Score</th><th>Attendance</th><th>CA Avg</th><th>Midterm</th><th>CGPA</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p._id} onClick={() => setSelected(p === selected ? null : p)} style={{ background: selected?._id === p._id ? 'var(--surface2)' : '' }}>
                        <td style={{ fontWeight: 500 }}>{p.student?.name || p.student_id}</td>
                        <td><span className="tag">{p.student_id}</span></td>
                        <td><span className={`risk-badge risk-${p.risk_level}`}>{p.risk_level}</span></td>
                        <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: p.risk_level === 'high' ? 'var(--high)' : p.risk_level === 'medium' ? 'var(--medium)' : 'var(--low)' }}>
                          {p.risk_score}
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', color: (p.features_used?.attendance_avg || 0) < 75 ? 'var(--high)' : '' }}>
                          {p.features_used?.attendance_avg}%
                        </td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{Math.round(p.features_used?.ca_avg || 0)}%</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{Math.round(p.features_used?.midterm_avg || 0)}%</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{p.features_used?.past_cgpa?.toFixed(2)}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No predictions yet. Run the model first.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.student?.name || selected.student_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.student_id} · Sem {selected.features_used?.semester}</div>
                </div>
                <span className={`risk-badge risk-${selected.risk_level}`}>{selected.risk_level}</span>
              </div>

              <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 16, background: 'var(--surface2)', borderRadius: 8 }}>
                <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--mono)', color: selected.risk_level === 'high' ? 'var(--high)' : selected.risk_level === 'medium' ? 'var(--medium)' : 'var(--low)' }}>
                  {selected.risk_score}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Risk Score</div>
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData(selected)}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="divider" />
              {[
                { label: 'Attendance', val: `${selected.features_used?.attendance_avg}%`, warn: selected.features_used?.attendance_avg < 75 },
                { label: 'CA Average', val: `${Math.round(selected.features_used?.ca_avg || 0)}%`, warn: selected.features_used?.ca_avg < 40 },
                { label: 'Midterm Avg', val: `${Math.round(selected.features_used?.midterm_avg || 0)}%`, warn: selected.features_used?.midterm_avg < 40 },
                { label: 'Past CGPA', val: selected.features_used?.past_cgpa?.toFixed(2), warn: selected.features_used?.past_cgpa < 2.5 },
                { label: 'Failed Subjects', val: selected.features_used?.failed_subjects, warn: selected.features_used?.failed_subjects > 0 },
              ].map(r => (
                <div className="metric-row" key={r.label}>
                  <span className="metric-label">{r.label}</span>
                  <span className="metric-val" style={{ color: r.warn ? 'var(--high)' : 'var(--low)' }}>{r.val}</span>
                </div>
              ))}

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                onClick={() => setShowIntervention(true)}
              >
                + Create Intervention
              </button>
            </div>
          )}
        </div>

        {showIntervention && (
          <div className="modal-overlay" onClick={() => setShowIntervention(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Create Intervention — {selected?.student?.name}</span>
                <button className="modal-close" onClick={() => setShowIntervention(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">Intervention Type</label>
                <select className="form-select" value={interventionForm.type} onChange={e => setInterventionForm({ ...interventionForm, type: e.target.value })}>
                  {INTERVENTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input className="form-input" type="date" value={interventionForm.scheduled_date} onChange={e => setInterventionForm({ ...interventionForm, scheduled_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" placeholder="Describe the intervention plan..." value={interventionForm.notes} onChange={e => setInterventionForm({ ...interventionForm, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowIntervention(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateIntervention} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
