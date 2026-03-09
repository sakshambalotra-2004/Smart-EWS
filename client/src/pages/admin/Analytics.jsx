import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

const COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/admin/analytics').catch(() => ({ data: null })),
      API.get('/admin/students').catch(() => ({ data: [] }))
    ]).then(([a, s]) => { setData(a.data); setStudents(s.data); });
  }, []);

  const pieData = data ? [
    { name: 'High Risk', value: data.riskBreakdown?.high || 0 },
    { name: 'Medium Risk', value: data.riskBreakdown?.medium || 0 },
    { name: 'Low Risk', value: data.riskBreakdown?.low || 0 },
  ] : [];

  const cgpaDistribution = [
    { range: '0.0-1.5', count: students.filter(s => s.past_cgpa < 1.5).length },
    { range: '1.5-2.0', count: students.filter(s => s.past_cgpa >= 1.5 && s.past_cgpa < 2.0).length },
    { range: '2.0-2.5', count: students.filter(s => s.past_cgpa >= 2.0 && s.past_cgpa < 2.5).length },
    { range: '2.5-3.0', count: students.filter(s => s.past_cgpa >= 2.5 && s.past_cgpa < 3.0).length },
    { range: '3.0-3.5', count: students.filter(s => s.past_cgpa >= 3.0 && s.past_cgpa < 3.5).length },
    { range: '3.5-4.0', count: students.filter(s => s.past_cgpa >= 3.5).length },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>Analytics</h2>
          <p>Platform-wide statistics for Spring 2025</p>
        </div>

        <div className="stats-grid cols-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Students', value: data?.totalStudents || 0 },
            { label: 'High Risk', value: data?.riskBreakdown?.high || 0, color: 'var(--high)' },
            { label: 'Medium Risk', value: data?.riskBreakdown?.medium || 0, color: 'var(--medium)' },
            { label: 'Low Risk', value: data?.riskBreakdown?.low || 0, color: 'var(--low)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--accent)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">Risk Distribution</div>
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={Object.values(COLORS)[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 40 }}>Run predictions to see distribution</div>}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              {Object.entries(COLORS).map(([k, c]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  <span style={{ textTransform: 'capitalize' }}>{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">CGPA Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cgpaDistribution} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
