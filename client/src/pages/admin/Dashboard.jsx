import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, riskBreakdown: { high: 0, medium: 0, low: 0 }, deptBreakdown: [] });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/admin/analytics').catch(() => ({ data: stats })),
      API.get('/admin/students').catch(() => ({ data: [] }))
    ]).then(([analyticsRes, studentsRes]) => {
      setStats(analyticsRes.data);
      setStudents(studentsRes.data.slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>Admin Dashboard</h2>
          <p>System overview for Spring 2025</p>
        </div>

        <div className="stats-grid cols-4">
          {[
            { label: 'Total Students', value: stats.totalStudents, sub: 'Enrolled this semester', color: 'var(--accent)' },
            { label: 'High Risk', value: stats.riskBreakdown?.high || 0, sub: 'Require intervention', color: 'var(--high)' },
            { label: 'Medium Risk', value: stats.riskBreakdown?.medium || 0, sub: 'Under monitoring', color: 'var(--medium)' },
            { label: 'Low Risk', value: stats.riskBreakdown?.low || 0, sub: 'On track', color: 'var(--low)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">Recent Students</div>
            {loading ? <div className="spinner" /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Dept</th><th>Sem</th><th>CGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.student_id}>
                        <td><span className="tag">{s.student_id}</span></td>
                        <td>{s.name}</td>
                        <td>{s.dept}</td>
                        <td>Sem {s.semester}</td>
                        <td style={{ fontFamily: 'var(--mono)', color: s.past_cgpa < 2 ? 'var(--high)' : s.past_cgpa < 3 ? 'var(--medium)' : 'var(--low)' }}>
                          {s.past_cgpa?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No students uploaded yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Department Breakdown</div>
            {stats.deptBreakdown?.map(d => (
              <div key={d._id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{d._id}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{d.count} students</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((d.count / stats.totalStudents) * 100, 100)}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
            {(!stats.deptBreakdown || stats.deptBreakdown.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet. Upload student records to see breakdown.</p>
            )}

            <div className="divider" />
            <div className="card-title">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="/admin/upload" className="btn btn-ghost" style={{ justifyContent: 'center' }}>↑ Upload Student Records</a>
              <a href="/admin/subjects" className="btn btn-ghost" style={{ justifyContent: 'center' }}>◫ Manage Subjects</a>
              <a href="/admin/users" className="btn btn-ghost" style={{ justifyContent: 'center' }}>◎ Manage Users</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
