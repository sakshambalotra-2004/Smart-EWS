import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@university.edu', password: 'Admin@123', color: '#8b5cf6' },
  { role: 'Faculty', email: 'roberts@university.edu', password: 'Faculty@123', color: '#0ea5e9' },
  { role: 'Counselor', email: 'counselor@university.edu', password: 'Counselor@123', color: '#10b981' },
  { role: 'Student', email: 'aisha@university.edu', password: 'Student@123', color: '#f59e0b' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleMap = { admin: '/admin', faculty: '/faculty', counselor: '/counselor', student: '/student' };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await login(email, password);
      navigate(roleMap[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="login-logo">
          <div className="bolt">⚡</div>
          <h1>SMART-EWS</h1>
          <p>Academic Early Warning System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email" placeholder="user@university.edu"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="divider" />

        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Quick Demo Login</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.role}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'center', borderColor: acc.color + '44' }}
                onClick={() => quickLogin(acc)}
                type="button"
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: acc.color, flexShrink: 0 }} />
                {acc.role}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 24 }}>
          SMART-EWS · Spring 2025 Hackathon
        </p>
      </div>
    </div>
  );
}
