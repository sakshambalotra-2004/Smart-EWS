import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

const TABS = ['ca', 'midterm', 'attendance'];
const TAB_LABELS = { ca: 'CA Marks', midterm: 'Midterm Marks', attendance: 'Attendance' };

const SAMPLES = {
  ca: `student_id,ca1,ca2,ca3,max\nCS2201,18,16,14,75\nCS2202,22,24,23,75\nCS2203,15,17,16,75`,
  midterm: `student_id,midterm_score,midterm_max\nCS2201,18,50\nCS2202,44,50\nCS2203,28,50`,
  attendance: `student_id,attendance_pct\nCS2201,62\nCS2202,95\nCS2203,72`
};

export default function FacultyUploadMarks() {
  const [activeTab, setActiveTab] = useState('ca');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/faculty/subjects').then(r => {
      setSubjects(r.data);
      if (r.data[0]) setSelectedSubject(r.data[0].subject_code);
    }).catch(() => {});
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedSubject) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('subject_code', selectedSubject);
      fd.append('type', activeTab);
      const r = await API.post('/faculty/uploadmarks', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLES[activeTab]], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sample_${activeTab}.csv`; a.click();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header-row">
          <div className="page-header" style={{ margin: 0 }}>
            <h2>Upload Marks</h2>
            <p>Upload CA marks, midterm scores, and attendance data</p>
          </div>
          <button className="btn btn-ghost" onClick={downloadSample}>↓ Sample CSV</button>
        </div>

        <div style={{ marginTop: 28 }} className="grid-2">
          <div>
            <div className="card">
              <div className="tabs">
                {TABS.map(t => (
                  <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => { setActiveTab(t); setFile(null); setResult(null); setError(''); }}>
                    {TAB_LABELS[t]}
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  {subjects.map(s => <option key={s.subject_code} value={s.subject_code}>{s.subject_code} — {s.subject_name}</option>)}
                  {subjects.length === 0 && <option>No subjects assigned</option>}
                </select>
              </div>

              <div
                className="upload-zone"
                onClick={() => document.getElementById('marks-file').click()}
              >
                <input id="marks-file" type="file" accept=".csv" onChange={e => { setFile(e.target.files[0]); setResult(null); }} />
                <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
                {file ? (
                  <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(file.size/1024).toFixed(1)} KB · Ready to upload</p></>
                ) : (
                  <><p style={{ fontWeight: 600 }}>Select {TAB_LABELS[activeTab]} CSV</p><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>One row per student</p></>
                )}
              </div>

              {error && <div className="alert alert-danger" style={{ marginTop: 12 }}>{error}</div>}
              {result && <div className="alert alert-success" style={{ marginTop: 12 }}>✓ {result.message}</div>}

              <button
                className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                onClick={handleUpload} disabled={!file || !selectedSubject || loading}
              >
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Uploading...</> : `↑ Upload ${TAB_LABELS[activeTab]}`}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Required CSV Columns — {TAB_LABELS[activeTab]}</div>
            {activeTab === 'ca' && (
              <>
                {[
                  { col: 'student_id', ex: 'CS2201', note: 'Student ID' },
                  { col: 'ca1', ex: '18', note: 'CA1 score' },
                  { col: 'ca2', ex: '16', note: 'CA2 score' },
                  { col: 'ca3', ex: '14', note: 'CA3 score' },
                  { col: 'max', ex: '75', note: 'Maximum total marks' },
                ].map(r => (
                  <div className="metric-row" key={r.col}>
                    <div><span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{r.col}</span><span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{r.note}</span></div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{r.ex}</span>
                  </div>
                ))}
              </>
            )}
            {activeTab === 'midterm' && (
              <>
                {[
                  { col: 'student_id', ex: 'CS2201', note: 'Student ID' },
                  { col: 'midterm_score', ex: '38', note: 'Raw midterm score' },
                  { col: 'midterm_max', ex: '50', note: 'Maximum marks' },
                ].map(r => (
                  <div className="metric-row" key={r.col}>
                    <div><span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{r.col}</span><span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{r.note}</span></div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{r.ex}</span>
                  </div>
                ))}
              </>
            )}
            {activeTab === 'attendance' && (
              <>
                {[
                  { col: 'student_id', ex: 'CS2201', note: 'Student ID' },
                  { col: 'attendance_pct', ex: '72', note: 'Attendance % (0-100)' },
                ].map(r => (
                  <div className="metric-row" key={r.col}>
                    <div><span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{r.col}</span><span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{r.note}</span></div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{r.ex}</span>
                  </div>
                ))}
              </>
            )}
            <div className="divider" />
            <div className="alert alert-info" style={{ fontSize: 12 }}>
              Each upload upserts data — re-uploading a file for the same subject will overwrite previous entries.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
