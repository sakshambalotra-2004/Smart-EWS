import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { API } from '../../context/AuthContext';

export default function CounselorGeneratePrediction() {
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [log, setLog] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/counselor/data-status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const addLog = (msg) => setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);

  const handlePredict = async () => {
    setRunning(true); setError(''); setResult(null); setLog([]);
    addLog('Initializing prediction pipeline...');
    
    await new Promise(r => setTimeout(r, 400));
    addLog('Aggregating marks data from all faculty uploads...');
    await new Promise(r => setTimeout(r, 600));
    addLog('Computing 6 features per student (attendance, CA, midterm, CGPA, failed subjects, semester)...');
    await new Promise(r => setTimeout(r, 500));
    addLog('Sending batch to ML model (Flask API port 5001)...');
    
    try {
      const r = await API.post('/counselor/predict', { semester_label: 'Spring 2025' });
      await new Promise(resolve => setTimeout(resolve, 300));
      addLog(`Model returned results for ${r.data.students_processed} students.`);
      addLog(`High: ${r.data.high} | Medium: ${r.data.medium} | Low: ${r.data.low}`);
      addLog('Storing predictions in database...');
      await new Promise(resolve => setTimeout(resolve, 200));
      addLog('✓ Prediction run complete!');
      setResult(r.data);
    } catch (err) {
      addLog('✗ Error: ' + (err.response?.data?.message || err.message));
      setError(err.response?.data?.message || 'Prediction failed');
    } finally {
      setRunning(false);
    }
  };

  const allReady = status?.ready;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>Generate Prediction</h2>
          <p>Run the ML model to assess student academic risk</p>
        </div>

        <div className="grid-2">
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Data Readiness</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span className={`status-dot ${allReady ? 'dot-green' : 'dot-yellow'}`} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {allReady ? 'All data ready — prediction can proceed' : `${status?.submittedFaculty || 0}/${status?.totalFaculty || 0} faculty have submitted`}
                </span>
              </div>

              {status?.subjects?.map(s => (
                <div key={s.subject?.subject_code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', width: 60 }}>{s.subject?.subject_code}</span>
                  <span style={{ fontSize: 13, flex: 1 }}>{s.faculty?.name || 'Unassigned'}</span>
                  <span style={{ fontSize: 12, color: s.ca ? 'var(--low)' : 'var(--high)' }}>CA</span>
                  <span style={{ fontSize: 12, color: s.midterm ? 'var(--low)' : 'var(--high)' }}>Mid</span>
                  <span style={{ fontSize: 12, color: s.attendance ? 'var(--low)' : 'var(--high)' }}>Att</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Model Configuration</div>
              {[
                { label: 'Model', val: 'MLP Perceptron v1.0' },
                { label: 'Architecture', val: '6 → 8 → 4 → 3' },
                { label: 'Features', val: '6 input features' },
                { label: 'Classes', val: 'High / Medium / Low' },
                { label: 'Accuracy', val: '87%' },
                { label: 'Endpoint', val: 'localhost:5001/api/predict/batch' },
              ].map(r => (
                <div className="metric-row" key={r.label}>
                  <span className="metric-label">{r.label}</span>
                  <span className="metric-val" style={{ fontSize: 12 }}>{r.val}</span>
                </div>
              ))}
              <div className="divider" />
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px' }}
                onClick={handlePredict}
                disabled={running || (!allReady && status !== null)}
              >
                {running ? (
                  <><span className="spinner" style={{ width: 18, height: 18 }} /> Running Prediction...</>
                ) : (
                  '⚡ Generate Prediction'
                )}
              </button>
              {!allReady && status !== null && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                  Waiting for all faculty to submit marks
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Execution Log</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, minHeight: 160, background: 'var(--bg)', borderRadius: 8, padding: 14 }}>
                {log.length === 0 && <span style={{ color: 'var(--text-dim)' }}>$ Awaiting prediction run...</span>}
                {log.map((l, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-dim)' }}>[{l.time}]</span>{' '}
                    <span style={{ color: l.msg.startsWith('✓') ? 'var(--low)' : l.msg.startsWith('✗') ? 'var(--high)' : 'var(--text)' }}>{l.msg}</span>
                  </div>
                ))}
                {running && <span className="animate-pulse" style={{ color: 'var(--accent)' }}>▋</span>}
              </div>
            </div>

            {result && (
              <div className="card fade-in">
                <div className="card-title">Prediction Results</div>
                <div className="stats-grid cols-3" style={{ margin: 0 }}>
                  <div style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--high-bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--high)', fontFamily: 'var(--mono)' }}>{result.high}</div>
                    <div style={{ fontSize: 12, color: 'var(--high)', marginTop: 4 }}>HIGH RISK</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--medium-bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--medium)', fontFamily: 'var(--mono)' }}>{result.medium}</div>
                    <div style={{ fontSize: 12, color: 'var(--medium)', marginTop: 4 }}>MEDIUM</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--low-bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--low)', fontFamily: 'var(--mono)' }}>{result.low}</div>
                    <div style={{ fontSize: 12, color: 'var(--low)', marginTop: 4 }}>LOW RISK</div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => navigate('/counselor/risk')}>
                  View Risk Analysis →
                </button>
              </div>
            )}
            {error && <div className="alert alert-danger" style={{ marginTop: 8 }}>{error}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
