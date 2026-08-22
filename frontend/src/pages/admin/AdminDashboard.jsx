import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExamStatsApi } from '../../api/examApi';
import { getAllResultsApi } from '../../api/resultApi';
import { getUsersApi } from '../../api/userApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [userCounts, setUserCounts] = useState({ total: 0, students: 0, teachers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getExamStatsApi(), getAllResultsApi({ limit: 6 }), getUsersApi({ limit: 1 })])
      .then(async ([statsRes, resultsRes, usersRes]) => {
        setStats(statsRes.data.stats);
        setRecentResults(resultsRes.data.results);
        // Get role counts
        const [sRes, tRes] = await Promise.all([
          getUsersApi({ role: 'student', limit: 1 }),
          getUsersApi({ role: 'teacher', limit: 1 }),
        ]);
        setUserCounts({ total: usersRes.data.total, students: sRes.data.total, teachers: tRes.data.total });
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Full system overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Exams" value={stats?.totalExams ?? 0} icon="📋" color="blue" />
        <StatCard label="Published" value={stats?.publishedExams ?? 0} icon="✅" color="green" />
        <StatCard label="Total Students" value={userCounts.students} icon="🎓" color="purple" />
        <StatCard label="Total Teachers" value={userCounts.teachers} icon="👨‍🏫" color="orange" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/users', label: 'Manage Users', icon: '👥' },
              { to: '/admin/exams', label: 'Manage Exams', icon: '📋' },
              { to: '/admin/results', label: 'All Results', icon: '📊' },
              { to: '/admin/org', label: 'Departments & Classes', icon: '🏫' },
              { to: '/admin/settings', label: 'System Settings', icon: '⚙️' },
            ].map(({ to, label, icon }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* User summary */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">User Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Students', count: userCounts.students, color: 'bg-blue-500' },
              { label: 'Teachers', count: userCounts.teachers, color: 'bg-green-500' },
              { label: 'Total Users', count: userCounts.total, color: 'bg-purple-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
                <span className="font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="font-bold text-gray-900">{stats?.bankQuestions ?? 0}</p>
              <p className="text-gray-400 text-xs">Bank Questions</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <p className="font-bold text-yellow-700">{stats?.pendingGrading ?? 0}</p>
              <p className="text-yellow-600 text-xs">Pending Grading</p>
            </div>
          </div>
        </div>

        {/* Recent results */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Results</h2>
            <Link to="/admin/results" className="text-sm text-primary-600 hover:underline">All →</Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentResults.map(r => (
                <Link key={r._id} to={`/results/${r._id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{r.student?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.exam?.title}</p>
                  </div>
                  <span className={`text-xs font-bold ml-2 ${r.isPassed ? 'text-green-600' : 'text-red-500'}`}>
                    {r.percentage}%
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
