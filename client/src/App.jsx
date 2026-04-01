import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import StudentDashboard from './pages/student/Dashboard';
import TopicsPage from './pages/student/TopicsPage';
import LevelsPage from './pages/student/LevelsPage';
import SlotBookingPage from './pages/student/SlotBookingPage';
import TestsPage from './pages/student/TestsPage';
import TestInterface from './pages/student/TestInterface';
import ResultPage from './pages/student/ResultPage';
import ProgressDashboard from './pages/student/ProgressDashboard';
import Leaderboard from './pages/student/Leaderboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageTopics from './pages/admin/ManageTopics';
import ManageLevels from './pages/admin/ManageLevels';
import ManageQuestions from './pages/admin/ManageQuestions';
import ManageStudents from './pages/admin/ManageStudents';
import ManageSlots from './pages/admin/ManageSlots';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AdminResetPassword from './pages/admin/AdminResetPassword';
import ManageAdmins from './pages/admin/ManageAdmins';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/topics" element={<ProtectedRoute role="student"><TopicsPage /></ProtectedRoute>} />
        <Route path="/topics/:topicId/levels" element={<ProtectedRoute role="student"><LevelsPage /></ProtectedRoute>} />
        <Route path="/book-slot" element={<ProtectedRoute role="student"><SlotBookingPage /></ProtectedRoute>} />
        <Route path="/tests" element={<ProtectedRoute role="student"><TestsPage /></ProtectedRoute>} />
        <Route path="/test" element={<ProtectedRoute role="student"><TestInterface /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute role="student"><ResultPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute role="student"><ProgressDashboard /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute role="student"><Leaderboard /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/topics" element={<ProtectedRoute role="admin"><ManageTopics /></ProtectedRoute>} />
        <Route path="/admin/levels" element={<ProtectedRoute role="admin"><ManageLevels /></ProtectedRoute>} />
        <Route path="/admin/questions" element={<ProtectedRoute role="admin"><ManageQuestions /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute role="admin"><ManageStudents /></ProtectedRoute>} />
        <Route path="/admin/slots" element={<ProtectedRoute role="admin"><ManageSlots /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/admin/manage-admins" element={<ProtectedRoute role="admin"><ManageAdmins /></ProtectedRoute>} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
