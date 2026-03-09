import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get('/student/me').catch(() => ({ data: null })),
      API.get('/student/interventions').catch(() => ({ data: [] }))
    ]).then(([meRes, intRes]) => {
      setData(meRes.data);
      setInterventions(intRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const { student, prediction, recommendations } = data || {};

  const riskColor = {
    high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)', undefined: 'var(--text-muted)'
  }[prediction?.risk_level];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>My Dashboard</h2>
          <p>Spring 2025 — {student?.dept} Department, Semester {student?.semester}</p>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {/* Risk Score Hero */}
            <div className="card" style={{
              marginBottom: 20,
              background: prediction ? `radial-gradient(ellipse at top right, ${riskColor}15 0%, transparent 60%), var(--surface)` : 'var(--surface)',
              borderColor: prediction ? riskColor + '44' : 'var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'center', padding: '8px 24px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 56, fontWeight: 800, fontFamily: 'var(--mono)', color: riskColor, lineHeight: 1 }}>
                    {prediction?.risk_score ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Risk Score</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>Academic Risk Status</span>
                    {prediction ? (
                      <span className={`risk-badge risk-${prediction.risk_level}`} style={{ fontSize: 13, padding: '4px 14px' }}>
                        {prediction.risk_level?.toUpperCase()}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No prediction yet</span>}
                  </div>
                  {prediction ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      {prediction.risk_level === 'high' && 'You are at high academic risk. Please review your performance and seek counseling immediately.'}
                      {prediction.risk_level === 'medium' && 'You are at medium risk. Focus on improving attendance and assessment scores.'}
                      {prediction.risk_level === 'low' && 'You are on track! Keep up the great work this semester.'}
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your academic risk assessment hasn't been run yet. Check back after your counselor generates predictions.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid-2">
              {/* Academic Metrics */}
              <div className="card">
                <div className="card-title">Academic Metrics</div>
                {prediction?.features_used ? (
                  <>
                    {[
                      { label: 'Attendance', val: `${prediction.features_used.attendance_avg}%`, warn: prediction.features_used.attendance_avg < 75, bar: prediction.features_used.attendance_avg },
                      { label: 'CA Average', val: `${Math.round(prediction.features_used.ca_avg)}%`, warn: prediction.features_used.ca_avg < 40, bar: prediction.features_used.ca_avg },
                      { label: 'Midterm Average', val: `${Math.round(prediction.features_used.midterm_avg)}%`, warn: prediction.features_used.midterm_avg < 40, bar: prediction.features_used.midterm_avg },
                      { label: 'Previous CGPA', val: `${prediction.features_used.past_cgpa?.toFixed(2)} / 4.0`, warn: prediction.features_used.past_cgpa < 2.5, bar: (prediction.features_used.past_cgpa / 4.0) * 100 },
                    ].map(m => (
                      <div key={m.label} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13 }}>{m.label}</span>
                          <span style={{ fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 600, color: m.warn ? 'var(--high)' : 'var(--low)' }}>{m.val}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${m.bar}%`, background: m.warn ? 'var(--high)' : 'var(--low)' }} />
                        </div>
                      </div>
                    ))}
                    {prediction.features_used.failed_subjects > 0 && (
                      <div className="alert alert-danger" style={{ marginTop: 8, fontSize: 13 }}>
                        ⚠ {prediction.features_used.failed_subjects} subject(s) at risk of failing
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No assessment data available yet.</p>
                )}
              </div>

              {/* AI Recommendations */}
              <div>
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-title">AI Recommendations</div>
                  {recommendations?.length > 0 ? (
                    recommendations.map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < recommendations.length - 1 ? '1px solid var(--border)' : '' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>0{i + 1}</span>
                        <p style={{ fontSize: 13, lineHeight: 1.6 }}>{rec}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Recommendations will appear after risk assessment.</p>
                  )}
                </div>

                {/* Interventions */}
                {interventions.length > 0 && (
                  <div className="card">
                    <div className="card-title">Scheduled Interventions</div>
                    {interventions.map(inv => (
                      <div key={inv._id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 18 }}>📌</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.type}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {inv.status} · {inv.scheduled_date ? new Date(inv.scheduled_date).toLocaleDateString() : 'TBD'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
