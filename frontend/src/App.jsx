import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Shared
import ExamForm from './pages/shared/ExamForm';

// Student
import Dashboard from './pages/student/Dashboard';
import ExamList from './pages/student/ExamList';
import ExamDetail from './pages/student/ExamDetail';
import TakeExam from './pages/student/TakeExam';
import MyResults from './pages/student/MyResults';
import ResultDetail from './pages/student/ResultDetail';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionBank from './pages/teacher/QuestionBank';
import TeacherExams from './pages/teacher/TeacherExams';
import TeacherExamManage from './pages/teacher/TeacherExamManage';
import ExamMonitor from './pages/teacher/ExamMonitor';
import GradeResult from './pages/teacher/GradeResult';
import ExamAnalytics from './pages/teacher/ExamAnalytics';
import TeacherResults from './pages/teacher/TeacherResults';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExams from './pages/admin/AdminExams';
import AdminResults from './pages/admin/AdminResults';
import AdminUsers from './pages/admin/AdminUsers';
import OrgManagement from './pages/admin/OrgManagement';

const AppLayout = ({ children }) => (
  <><Navbar /><main>{children}</main></>
);

// Smart root redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RootRedirect />} />

        {/* ── Student ─────────────────────────────────────── */}
        <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute roles={['student']}><AppLayout><ExamList /></AppLayout></ProtectedRoute>} />
        <Route path="/exams/:id" element={<ProtectedRoute roles={['student']}><AppLayout><ExamDetail /></AppLayout></ProtectedRoute>} />
        <Route path="/exam/:examId/take/:resultId" element={<ProtectedRoute roles={['student']}><TakeExam /></ProtectedRoute>} />
        <Route path="/my-results" element={<ProtectedRoute roles={['student']}><AppLayout><MyResults /></AppLayout></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><AppLayout><ResultDetail /></AppLayout></ProtectedRoute>} />

        {/* ── Teacher ─────────────────────────────────────── */}
        <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['teacher']}><AppLayout><TeacherDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/question-bank" element={<ProtectedRoute roles={['teacher']}><AppLayout><QuestionBank /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/exams" element={<ProtectedRoute roles={['teacher']}><AppLayout><TeacherExams /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/exams/new" element={<ProtectedRoute roles={['teacher']}><AppLayout><ExamForm /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/exams/:id" element={<ProtectedRoute roles={['teacher']}><AppLayout><TeacherExamManage /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/exams/:id/edit" element={<ProtectedRoute roles={['teacher']}><AppLayout><ExamForm /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/exams/:id/monitor" element={<ProtectedRoute roles={['teacher']}><AppLayout><ExamMonitor /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/exams/:id/analytics" element={<ProtectedRoute roles={['teacher']}><AppLayout><ExamAnalytics /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/results" element={<ProtectedRoute roles={['teacher']}><AppLayout><TeacherResults /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/grading" element={<ProtectedRoute roles={['teacher']}><AppLayout><TeacherResults /></AppLayout></ProtectedRoute>} />
        <Route path="/teacher/grade/:id" element={<ProtectedRoute roles={['teacher', 'admin']}><AppLayout><GradeResult /></AppLayout></ProtectedRoute>} />

        {/* ── Admin ────────────────────────────────────────── */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/exams" element={<ProtectedRoute roles={['admin']}><AppLayout><AdminExams /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/exams/new" element={<ProtectedRoute roles={['admin']}><AppLayout><ExamForm /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/exams/:id" element={<ProtectedRoute roles={['admin']}><AppLayout><TeacherExamManage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/exams/:id/edit" element={<ProtectedRoute roles={['admin']}><AppLayout><ExamForm /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/exams/:id/monitor" element={<ProtectedRoute roles={['admin']}><AppLayout><ExamMonitor /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/exams/:id/analytics" element={<ProtectedRoute roles={['admin']}><AppLayout><ExamAnalytics /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute roles={['admin']}><AppLayout><AdminResults /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AppLayout><AdminUsers /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/org" element={<ProtectedRoute roles={['admin']}><AppLayout><OrgManagement /></AppLayout></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
