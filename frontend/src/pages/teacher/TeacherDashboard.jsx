import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getExamStatsApi } from '../../api/examApi';
import { getExamsApi } from '../../api/examApi';
import { getAllResultsApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [pendingGrading, setPendingGrading] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getExamStatsApi(),
      getExamsApi(),
      getAllResultsApi({ gradingStatus: 'pending-review', limit: 5 }),
    ]).then(([statsRes, examsRes, resultsRes]) => {
      setStats(statsRes.data.stats);
      setExams(examsRes.data.exams.slice(0, 5));
      setPendingGrading(resultsRes.data.results);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const activeExams = exams.filter(e => e.status === 'active' || e.isPublished).length;
  const draftExams = exams.filter(e => !e.isPublished).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your teaching overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Exams" value={stats?.totalExams ?? 0} icon="📋" color="blue" />
        <StatCard label="Published" value={stats?.publishedExams ?? 0} icon="✅" color="green" />
        <StatCard label="Bank Questions" value={stats?.bankQuestions ?? 0} icon="📚" color="purple" />
        <StatCard label="Pending Grading" value={stats?.pendingGrading ?? 0} icon="✏️" color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/teacher/exams/new', label: 'Create Exam', icon: '➕' },
              { to: '/teacher/question-bank', label: 'Question Bank', icon: '📚' },
              { to: '/teacher/results', label: 'View Results', icon: '📊' },
              { to: '/teacher/grading', label: 'Grade Essays', icon: '✏️' },
            ].map(({ to, label, icon }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* My Exams */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Exams</h2>
            <Link to="/teacher/exams" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {exams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No exams yet.</p>
          ) : (
            <div className="space-y-2">
              {exams.map(exam => (
                <Link key={exam._id} to={`/teacher/exams/${exam._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                    <p className="text-xs text-gray-400">{exam.subject} · {exam.duration} min</p>
                  </div>
                  <span className={exam.isPublished ? 'badge-green' : 'badge-gray'}>
                    {exam.isPublished ? 'Live' : 'Draft'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Grading */}
        {pendingGrading.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pending Manual Grading</h2>
              <Link to="/teacher/grading" className="text-sm text-primary-600 hover:underline">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-2">Student</th>
                    <th className="pb-2">Exam</th>
                    <th className="pb-2">Submitted</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingGrading.map(r => (
                    <tr key={r._id}>
                      <td className="py-2 font-medium text-gray-900">{r.student?.name}</td>
                      <td className="py-2 text-gray-500">{r.exam?.title}</td>
                      <td className="py-2 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Link to={`/teacher/grade/${r._id}`}
                          className="text-xs btn-primary py-1 px-3">Grade</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
