import Sidebar from '../../components/Sidebar';

const resources = [
  { title: 'Academic Counseling', desc: 'Book a one-on-one session with your academic counselor to discuss your progress and create an improvement plan.', icon: '🎓', contact: 'counselor@university.edu' },
  { title: 'Tutoring Center', desc: 'Free peer tutoring available for all subjects. Walk-in sessions every weekday 9AM–5PM at the Learning Resource Center.', icon: '📚', contact: 'tutoring@university.edu' },
  { title: 'Peer Mentoring', desc: 'Connect with a senior student mentor who can guide you through academic challenges and share study strategies.', icon: '🤝', contact: 'mentors@university.edu' },
  { title: 'Student Support Office', desc: 'For urgent academic or personal issues, visit the Student Support Office on the 2nd floor of the main building.', icon: '🏢', contact: 'support@university.edu' },
];

const tips = [
  { title: 'Attend all classes', desc: 'Attendance directly affects your risk score. Missing more than 25% of classes significantly increases academic risk.' },
  { title: 'Submit assignments on time', desc: 'Continuous Assessment (CA) marks contribute 30% to your risk score. Never miss a deadline.' },
  { title: 'Study in groups', desc: 'Collaborative learning improves retention by up to 40%. Form study groups for difficult subjects.' },
  { title: 'Meet with faculty', desc: 'If you are struggling with a subject, approach the faculty during office hours. Most professors are happy to help.' },
  { title: 'Track your progress', desc: 'Check the My Progress page regularly to monitor your performance before it becomes critical.' },
];

export default function StudentHelp() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h2>Get Help</h2>
          <p>Resources and support for your academic success</p>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {resources.map(r => (
            <div className="card" key={r.title} style={{ display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{r.title}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{r.desc}</p>
                <a href={`mailto:${r.contact}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                  {r.contact}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Academic Success Tips</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {tips.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: 'var(--surface2)', borderRadius: 8 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--mono)', fontSize: 13 }}>0{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.title}</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20, borderColor: 'var(--accent)44', background: 'var(--accent-glow)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>SMART-EWS is watching over your progress</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Our AI model continuously monitors your attendance, marks, and academic history to identify risk early — so you can take action before it's too late.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
