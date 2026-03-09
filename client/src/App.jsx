import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUploadRecords from './pages/admin/UploadRecords';
import AdminUsers from './pages/admin/Users';
import AdminSubjects from './pages/admin/Subjects';
import AdminAnalytics from './pages/admin/Analytics';

import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyUploadMarks from './pages/faculty/UploadMarks';
import FacultyBehavior from './pages/faculty/Behavior';

import CounselorDashboard from './pages/counselor/Dashboard';
import CounselorPredict from './pages/counselor/GeneratePrediction';
import CounselorRiskAnalysis from './pages/counselor/RiskAnalysis';
import CounselorInterventions from './pages/counselor/Interventions';

import StudentDashboard from './pages/student/Dashboard';
import StudentProgress from './pages/student/MyProgress';
import StudentHelp from './pages/student/GetHelp';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  const map = { admin: '/admin', faculty: '/faculty', counselor: '/counselor', student: '/student' };
  return <Navigate to={map[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/upload" element={<ProtectedRoute roles={['admin']}><AdminUploadRecords /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute roles={['admin']}><AdminSubjects /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

          {/* Faculty */}
          <Route path="/faculty" element={<ProtectedRoute roles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/faculty/marks" element={<ProtectedRoute roles={['faculty']}><FacultyUploadMarks /></ProtectedRoute>} />
          <Route path="/faculty/behavior" element={<ProtectedRoute roles={['faculty']}><FacultyBehavior /></ProtectedRoute>} />

          {/* Counselor */}
          <Route path="/counselor" element={<ProtectedRoute roles={['counselor']}><CounselorDashboard /></ProtectedRoute>} />
          <Route path="/counselor/predict" element={<ProtectedRoute roles={['counselor']}><CounselorPredict /></ProtectedRoute>} />
          <Route path="/counselor/risk" element={<ProtectedRoute roles={['counselor']}><CounselorRiskAnalysis /></ProtectedRoute>} />
          <Route path="/counselor/interventions" element={<ProtectedRoute roles={['counselor']}><CounselorInterventions /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/progress" element={<ProtectedRoute roles={['student']}><StudentProgress /></ProtectedRoute>} />
          <Route path="/student/help" element={<ProtectedRoute roles={['student']}><StudentHelp /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
