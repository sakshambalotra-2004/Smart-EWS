import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function FacultyDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/faculty/subjects').catch(() => ({ data: [] })),
      API.get('/faculty/submissionstatus').catch(() => ({ data: [] }))
    ]).then(([sRes, stRes]) => {
      setSubjects(sRes.data);
      setStatus(stRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const allDone = status.length > 0 && status.every(s => s.ca_submitted && s.midterm_submitted && s.attendance_submitted);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>Faculty Dashboard</h2>
          <p>Manage your subjects and upload marks</p>
        </div>

        {allDone && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            ✓ All marks submitted for all subjects!
          </div>
        )}

        <div className="stats-grid cols-3" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Assigned Subjects</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{subjects.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fully Submitted</div>
            <div className="stat-value" style={{ color: 'var(--low)' }}>
              {status.filter(s => s.ca_submitted && s.midterm_submitted && s.attendance_submitted).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Uploads</div>
            <div className="stat-value" style={{ color: 'var(--medium)' }}>
              {status.filter(s => !s.ca_submitted || !s.midterm_submitted || !s.attendance_submitted).length}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Submission Status</div>
          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th><th>Students</th><th>CA Marks</th><th>Midterm</th><th>Attendance</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {status.map(s => {
                    const done = s.ca_submitted && s.midterm_submitted && s.attendance_submitted;
                    return (
                      <tr key={s.subject_code}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.subject_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{s.subject_code}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{s.students_count}</td>
                        <td>
                          <span style={{ color: s.ca_submitted ? 'var(--low)' : 'var(--high)' }}>
                            {s.ca_submitted ? '✓ Done' : '✗ Pending'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: s.midterm_submitted ? 'var(--low)' : 'var(--high)' }}>
                            {s.midterm_submitted ? '✓ Done' : '✗ Pending'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: s.attendance_submitted ? 'var(--low)' : 'var(--high)' }}>
                            {s.attendance_submitted ? '✓ Done' : '✗ Pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge ${done ? 'risk-low' : 'risk-medium'}`}>
                            {done ? 'Complete' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {status.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                      No subjects assigned. Contact admin.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <a href="/faculty/marks" className="btn btn-primary">↑ Upload Marks</a>
        </div>
      </main>
    </div>
  );
}
