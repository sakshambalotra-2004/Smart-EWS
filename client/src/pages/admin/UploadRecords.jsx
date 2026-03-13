import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

const SAMPLE_CSV = `student_id,name,email,parent_email,dept,semester,past_cgpa,enrolled_subjects
CS2201,Aisha Rahman,aisha@university.edu,parent.aisha@gmail.com,CS,2,9.10,CS301;CS302;CS303;CS304
CS2202,James Wilson,james@university.edu,parent.james@gmail.com,CS,5,2.58,CS301;CS302;CS303;CS304`;

export default function AdminUploadRecords() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await API.post('/admin/uploadrecords', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sample_students.csv'; a.click();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header-row">
          <div className="page-header" style={{ margin: 0 }}>
            <h2>Upload Student Records</h2>
            <p>Import student master data for the semester</p>
          </div>
          <button className="btn btn-ghost" onClick={downloadSample}>↓ Download Sample CSV</button>
        </div>

        <div style={{ marginTop: 28 }} className="grid-2">
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title">Upload CSV File</div>
              <div
                className="upload-zone"
                onClick={() => document.getElementById('csv-input').click()}
              >
                <input
                  id="csv-input" type="file" accept=".csv"
                  onChange={e => setFile(e.target.files[0])}
                />
                <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                {file ? (
                  <><p style={{ fontWeight: 600 }}>{file.name}</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(file.size / 1024).toFixed(1)} KB</p></>
                ) : (
                  <><p style={{ fontWeight: 600 }}>Click to select CSV file</p><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>or drag and drop here</p></>
                )}
              </div>
              {error && <div className="alert alert-danger" style={{ marginTop: 12 }}>{error}</div>}
              {result && (
                <div className="alert alert-success" style={{ marginTop: 12 }}>
                  ✓ Success! Created {result.created}, Updated {result.updated} records.
                </div>
              )}
              <button
                className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                onClick={handleUpload} disabled={!file || loading}
              >
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : '↑ Upload Records'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">CSV Format Guide</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Your CSV must include these columns:</p>
            {[
              { col: 'student_id',        ex: 'CS2201',                    note: 'Unique student ID' },
              { col: 'name',              ex: 'Aisha Rahman',              note: 'Full name' },
              { col: 'email',             ex: 'aisha@university.edu',      note: 'University email' },
              { col: 'parent_email',      ex: 'parent.aisha@gmail.com',    note: 'Parent contact email' },
              { col: 'dept',              ex: 'CS',                        note: 'CS | EE | ME | BBA' },
              { col: 'semester',          ex: '3',                         note: 'Current semester (1–8)' },
              { col: 'past_cgpa',         ex: '7.50',                      note: 'Previous CGPA (0.0–10.0)' },
              { col: 'enrolled_subjects', ex: 'CS301;CS302',               note: 'Semicolon separated' },
            ].map(r => (
              <div className="metric-row" key={r.col}>
                <div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{r.col}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{r.note}</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{r.ex}</span>
              </div>
            ))}
            <div className="alert alert-info" style={{ marginTop: 16, fontSize: 12 }}>
              Student login accounts are created automatically with default password: Student@123
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}