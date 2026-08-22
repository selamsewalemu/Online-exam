import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExamApi } from '../../api/examApi';
import { getExamAnalyticsApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const DIFF_COLOR = { easy: 'text-green-600', medium: 'text-yellow-600', hard: 'text-red-600' };

const ExamAnalytics = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getExamApi(id), getExamAnalyticsApi(id)]).then(([examRes, anaRes]) => {
      setExam(examRes.data.exam);
      setAnalytics(anaRes.data.analytics);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;
  if (!analytics) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <p className="text-4xl mb-3">📊</p>
      <p className="text-gray-500">No submissions yet for <strong>{exam?.title}</strong>.</p>
      <Link to={`/teacher/exams/${id}/monitor`} className="btn-primary mt-4 inline-flex">Go to Monitor</Link>
    </div>
  );

  const { totalSubmissions, passed, failed, passRate, avgScore, avgPercent, highest, lowest, gradeDist, questionAnalysis } = analytics;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">{exam?.title}</p>
        </div>
        <Link to={`/teacher/exams/${id}/monitor`} className="btn-secondary text-sm">← Monitor</Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Submissions', value: totalSubmissions, color: 'text-blue-600' },
          { label: 'Pass Rate', value: `${passRate}%`, color: 'text-green-600' },
          { label: 'Avg Score', value: `${avgPercent}%`, color: 'text-purple-600' },
          { label: 'Highest', value: `${highest}`, color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Pass/Fail */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Pass / Fail</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">Passed: {passed}</span>
                <span className="text-red-500 font-medium">Failed: {failed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${passRate}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">{passRate}% pass rate</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="font-bold text-gray-900">{highest}</p>
              <p className="text-gray-400 text-xs">Highest Score</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="font-bold text-gray-900">{lowest}</p>
              <p className="text-gray-400 text-xs">Lowest Score</p>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Grade Distribution</h2>
          {Object.keys(gradeDist).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No grade data</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(gradeDist).sort().map(([grade, count]) => (
                <div key={grade} className="flex items-center gap-3">
                  <span className="w-8 font-bold text-gray-700 text-sm">{grade}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5">
                    <div className="bg-primary-500 h-5 rounded-full flex items-center px-2"
                      style={{ width: `${Math.max(10, (count / totalSubmissions) * 100)}%` }}>
                      <span className="text-white text-xs font-medium">{count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {Math.round((count / totalSubmissions) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question Analysis */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Question Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-2 text-xs text-gray-500 uppercase">#</th>
                <th className="pb-2 text-xs text-gray-500 uppercase">Question</th>
                <th className="pb-2 text-xs text-gray-500 uppercase">Difficulty</th>
                <th className="pb-2 text-xs text-gray-500 uppercase">Marks</th>
                <th className="pb-2 text-xs text-gray-500 uppercase">Correct</th>
                <th className="pb-2 text-xs text-gray-500 uppercase">Difficulty Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {questionAnalysis.map((q, i) => (
                <tr key={q.questionId} className="hover:bg-gray-50">
                  <td className="py-2.5 text-gray-400">{i + 1}</td>
                  <td className="py-2.5 max-w-xs">
                    <p className="truncate text-gray-900">{q.questionText}</p>
                  </td>
                  <td className="py-2.5">
                    <span className={`font-medium ${DIFF_COLOR[q.difficultyLevel]}`}>{q.difficultyLevel}</span>
                  </td>
                  <td className="py-2.5 text-gray-500">{q.marks}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${q.correctPercent >= 60 ? 'bg-green-500' : q.correctPercent >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${q.correctPercent}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{q.correctPercent}%</span>
                    </div>
                    <p className="text-xs text-gray-400">{q.correctAttempts}/{q.totalAttempts}</p>
                  </td>
                  <td className="py-2.5">
                    <span className={`font-medium ${q.difficultyIndex >= 60 ? 'text-green-600' : q.difficultyIndex >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {q.difficultyIndex !== null ? `${q.difficultyIndex}%` : 'N/A'}
                    </span>
                    <p className="text-xs text-gray-400">
                      {q.difficultyIndex >= 70 ? 'Too Easy' : q.difficultyIndex <= 30 ? 'Too Hard' : 'Good'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Difficulty Index = % of students who answered correctly. 30–70% is ideal.
        </p>
      </div>
    </div>
  );
};

export default ExamAnalytics;
