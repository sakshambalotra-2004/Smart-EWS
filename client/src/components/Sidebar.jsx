import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navConfig = {
  admin: [
    { label: 'Overview', items: [
      { name: 'Dashboard', path: '/admin', icon: '⊞' },
      { name: 'Upload Records', path: '/admin/upload', icon: '↑' },
      { name: 'Subjects', path: '/admin/subjects', icon: '◫' },
    ]},
    { label: 'Management', items: [
      { name: 'Users', path: '/admin/users', icon: '◎' },
      { name: 'Analytics', path: '/admin/analytics', icon: '▦' },
    ]},
  ],
  faculty: [
    { label: 'Overview', items: [
      { name: 'Dashboard', path: '/faculty', icon: '⊞' },
      { name: 'Upload Marks', path: '/faculty/marks', icon: '↑' },
      { name: 'Behavior Rating', path: '/faculty/behavior', icon: '◎' },
    ]},
  ],
  counselor: [
    { label: 'Overview', items: [
      { name: 'Dashboard', path: '/counselor', icon: '⊞' },
      { name: 'Generate Prediction', path: '/counselor/predict', icon: '⚡' },
    ]},
    { label: 'Risk Management', items: [
      { name: 'Risk Analysis', path: '/counselor/risk', icon: '▦' },
      { name: 'Interventions', path: '/counselor/interventions', icon: '◫' },
    ]},
  ],
  student: [
    { label: 'Overview', items: [
      { name: 'Dashboard', path: '/student', icon: '⊞' },
      { name: 'My Progress', path: '/student/progress', icon: '▦' },
      { name: 'Get Help', path: '/student/help', icon: '◎' },
    ]},
  ],
};

const roleColors = {
  admin: '#8b5cf6',
  faculty: '#0ea5e9',
  counselor: '#10b981',
  student: '#f59e0b',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  const sections = navConfig[user.role] || [];
  const color = roleColors[user.role];
  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">⚡ SMART-EWS</div>
        <h1>Early Warning System</h1>
        <p>Spring 2025</p>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div className="nav-section" key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map(item => (
              <button
                key={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar" style={{ background: color }}>{initials}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '2px' }}
            title="Logout"
          >⎋</button>
        </div>
      </div>
    </aside>
  );
}
