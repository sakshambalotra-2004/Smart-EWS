import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function FacultyBehavior() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    API.get('/faculty/subjects').then(r => {
      setSubjects(r.data);
      if (r.data[0]) setSelectedSubject(r.data[0].subject_code);
    });
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    API.get(`/faculty/students/${selectedSubject}`).then(r => {
      setStudents(r.data);
      const init = {};
      r.data.forEach(s => { init[s.student_id] = { participation: 3, attention: 3, discipline: 3 }; });
      setRatings(init);
    }).catch(() => setStudents([]));
  }, [selectedSubject]);

  const handleRate = (studentId, key, val) => {
    setRatings(prev => ({ ...prev, [studentId]: { ...prev[studentId], [key]: parseInt(val) } }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const ratingsList = Object.entries(ratings).map(([student_id, r]) => ({ student_id, ...r }));
      await API.post('/faculty/behavior', { ratings: ratingsList, subject_code: selectedSubject });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const RatingSelect = ({ value, onChange }) => (
    <select className="form-select" style={{ padding: '4px 8px', fontSize: 12, width: 60 }} value={value} onChange={e => onChange(e.target.value)}>
      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>Behavior Rating</h2>
          <p>Rate student participation, attention, and discipline</p>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Subject</label>
            <select className="form-select" style={{ maxWidth: 300 }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              {subjects.map(s => <option key={s.subject_code} value={s.subject_code}>{s.subject_code} — {s.subject_name}</option>)}
            </select>
          </div>
        </div>

        {saved && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ Behavior ratings saved successfully!</div>}

        <div className="card">
          <div className="card-title">Student Ratings (1 = Poor, 5 = Excellent)</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th><th>ID</th>
                  <th>Participation</th><th>Attention</th><th>Discipline</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.student_id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td><span className="tag">{s.student_id}</span></td>
                    <td><RatingSelect value={ratings[s.student_id]?.participation || 3} onChange={v => handleRate(s.student_id, 'participation', v)} /></td>
                    <td><RatingSelect value={ratings[s.student_id]?.attention || 3} onChange={v => handleRate(s.student_id, 'attention', v)} /></td>
                    <td><RatingSelect value={ratings[s.student_id]?.discipline || 3} onChange={v => handleRate(s.student_id, 'discipline', v)} /></td>
                  </tr>
                ))}
                {students.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Select a subject to see students</td></tr>}
              </tbody>
            </table>
          </div>
          {students.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : '✓ Save Ratings'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
