import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getExamsApi } from '../../api/examApi';
import { getStudentHistoryApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState({ results: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getExamsApi(), getStudentHistoryApi('me')]).then(([examRes, histRes]) => {
      setExams(examRes.data.exams.slice(0, 4));
      setHistory(histRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const { summary = {}, results = [] } = history;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your learning overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Available Exams" value={exams.length} icon="📋" color="blue" />
        <StatCard label="Exams Taken" value={summary.total || 0} icon="✅" color="green" />
        <StatCard label="Passed" value={summary.passed || 0} icon="🏆" color="purple" />
        <StatCard label="Avg Score" value={`${summary.avgPercent || 0}%`} icon="📊" color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Exams */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Available Exams</h2>
            <Link to="/exams" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {exams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No exams available yet.</p>
          ) : (
            <div className="space-y-3">
              {exams.map(exam => (
                <Link key={exam._id} to={`/exams/${exam._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                    <p className="text-xs text-gray-400">{exam.subject} · {exam.duration} min · {exam.totalMarks} marks</p>
                  </div>
                  <span className="text-xs text-primary-600 font-medium">Start →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Results</h2>
            <Link to="/my-results" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {results.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No exam results yet.</p>
          ) : (
            <div className="space-y-3">
              {results.slice(0, 5).map(result => (
                <Link key={result._id} to={`/results/${result._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{result.exam?.title}</p>
                    <p className="text-xs text-gray-400">{result.exam?.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${result.isPassed ? 'text-green-600' : 'text-red-500'}`}>
                      {result.percentage}%
                    </p>
                    <div className="flex gap-1 justify-end">
                      <span className={result.isPassed ? 'badge-green' : 'badge-red'}>
                        {result.isPassed ? 'Pass' : 'Fail'}
                      </span>
                      {result.grade && <span className="badge-blue">{result.grade}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
