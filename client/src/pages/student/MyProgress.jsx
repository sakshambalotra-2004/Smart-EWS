import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function StudentProgress() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/student/marks').then(r => setMarks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const caAvg = avg(marks.map(m => m.ca_marks?.max > 0 ? (m.ca_marks.total / m.ca_marks.max) * 100 : 0));
  const midAvg = avg(marks.map(m => m.midterm_max > 0 ? (m.midterm_score / m.midterm_max) * 100 : 0));
  const attAvg = avg(marks.map(m => m.attendance_pct || 0));

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>My Progress</h2>
          <p>Subject-wise marks and attendance for Spring 2025</p>
        </div>

        <div className="stats-grid cols-3" style={{ marginBottom: 24 }}>
          {[
            { label: 'CA Average', val: `${Math.round(caAvg)}%`, color: caAvg < 40 ? 'var(--high)' : caAvg < 60 ? 'var(--medium)' : 'var(--low)' },
            { label: 'Midterm Average', val: `${Math.round(midAvg)}%`, color: midAvg < 40 ? 'var(--high)' : midAvg < 60 ? 'var(--medium)' : 'var(--low)' },
            { label: 'Avg Attendance', val: `${Math.round(attAvg)}%`, color: attAvg < 75 ? 'var(--high)' : 'var(--low)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Subject-wise Performance</div>
          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>CA1</th><th>CA2</th><th>CA3</th><th>CA Total</th>
                    <th>Midterm</th><th>Attendance</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map(m => {
                    const caPct = m.ca_marks?.max > 0 ? (m.ca_marks.total / m.ca_marks.max) * 100 : 0;
                    const midPct = m.midterm_max > 0 ? (m.midterm_score / m.midterm_max) * 100 : 0;
                    const atRisk = caPct < 40 || midPct < 40 || m.attendance_pct < 75;
                    return (
                      <tr key={m._id}>
                        <td><span className="tag" style={{ fontFamily: 'var(--mono)' }}>{m.subject_code}</span></td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{m.ca_marks?.ca1 || 0}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{m.ca_marks?.ca2 || 0}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{m.ca_marks?.ca3 || 0}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: caPct < 40 ? 'var(--high)' : '' }}>
                          {m.ca_marks?.total || 0}/{m.ca_marks?.max || 75} ({Math.round(caPct)}%)
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', color: midPct < 40 ? 'var(--high)' : '' }}>
                          {m.midterm_score || 0}/{m.midterm_max || 50} ({Math.round(midPct)}%)
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', color: m.attendance_pct < 75 ? 'var(--high)' : 'var(--low)' }}>
                          {m.attendance_pct}%
                        </td>
                        <td>
                          <span className={`risk-badge ${atRisk ? 'risk-high' : 'risk-low'}`}>
                            {atRisk ? 'At Risk' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {marks.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No marks uploaded yet by faculty.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
