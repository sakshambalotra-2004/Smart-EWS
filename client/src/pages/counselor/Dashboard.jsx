import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function CounselorDashboard() {
  const [status, setStatus] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get('/counselor/data-status').catch(() => ({ data: null })),
      API.get('/counselor/predictions').catch(() => ({ data: [] }))
    ]).then(([sRes, pRes]) => {
      setStatus(sRes.data);
      setPredictions(pRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const high = predictions.filter(p => p.risk_level === 'high').length;
  const medium = predictions.filter(p => p.risk_level === 'medium').length;
  const low = predictions.filter(p => p.risk_level === 'low').length;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>Counselor Dashboard</h2>
          <p>Academic risk monitoring — Spring 2025</p>
        </div>

        <div className="stats-grid cols-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Faculty Submitted</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>
              {loading ? '—' : `${status?.submittedFaculty || 0}/${status?.totalFaculty || 0}`}
            </div>
            <div className="stat-sub">Data readiness</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Risk</div>
            <div className="stat-value" style={{ color: 'var(--high)' }}>{high}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Medium Risk</div>
            <div className="stat-value" style={{ color: 'var(--medium)' }}>{medium}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low Risk</div>
            <div className="stat-value" style={{ color: 'var(--low)' }}>{low}</div>
          </div>
        </div>

        {/* Data Readiness Panel */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>Faculty Data Readiness</div>
            {status?.ready ? (
              <button className="btn btn-primary" onClick={() => navigate('/counselor/predict')}>
                ⚡ Generate Prediction
              </button>
            ) : (
              <button className="btn btn-ghost" disabled title="Waiting for all faculty submissions">
                ⚡ Generate Prediction
              </button>
            )}
          </div>

          {!status?.ready && status?.totalFaculty > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: 14 }}>
              Waiting for {(status?.totalFaculty || 0) - (status?.submittedFaculty || 0)} more faculty to complete all uploads before prediction can run.
            </div>
          )}

          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Subject</th><th>Faculty</th><th>CA Marks</th><th>Midterm</th><th>Attendance</th></tr>
                </thead>
                <tbody>
                  {status?.subjects?.map(s => (
                    <tr key={s.subject?.subject_code}>
                      <td>
                        <span className="tag" style={{ fontFamily: 'var(--mono)' }}>{s.subject?.subject_code}</span>
                        <span style={{ marginLeft: 8, fontSize: 13 }}>{s.subject?.subject_name}</span>
                      </td>
                      <td style={{ color: s.faculty ? 'var(--text)' : 'var(--high)', fontSize: 13 }}>
                        {s.faculty?.name || '✗ Unassigned'}
                      </td>
                      <td><span style={{ color: s.ca ? 'var(--low)' : 'var(--high)' }}>{s.ca ? '✓' : '✗'}</span></td>
                      <td><span style={{ color: s.midterm ? 'var(--low)' : 'var(--high)' }}>{s.midterm ? '✓' : '✗'}</span></td>
                      <td><span style={{ color: s.attendance ? 'var(--low)' : 'var(--high)' }}>{s.attendance ? '✓' : '✗'}</span></td>
                    </tr>
                  ))}
                  {(!status?.subjects || status.subjects.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No subjects configured</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent predictions */}
        {predictions.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="card-title" style={{ margin: 0 }}>Recent Risk Results</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/counselor/risk')}>View All →</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Risk Level</th><th>Score</th><th>Attendance</th><th>CGPA</th></tr></thead>
                <tbody>
                  {predictions.map(p => (
                    <tr key={p._id} onClick={() => navigate('/counselor/risk')}>
                      <td style={{ fontWeight: 500 }}>{p.student?.name || p.student_id}</td>
                      <td><span className={`risk-badge risk-${p.risk_level}`}>{p.risk_level}</span></td>
                      <td style={{ fontFamily: 'var(--mono)', color: p.risk_level === 'high' ? 'var(--high)' : p.risk_level === 'medium' ? 'var(--medium)' : 'var(--low)' }}>
                        {p.risk_score}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{p.features_used?.attendance_avg}%</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{p.features_used?.past_cgpa?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
