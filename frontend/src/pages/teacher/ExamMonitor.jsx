import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExamApi } from '../../api/examApi';
import { monitorExamApi } from '../../api/examApi';
import { getExamResultsApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExamMonitor = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [inProgress, setInProgress] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    Promise.all([monitorExamApi(id), getExamResultsApi(id)]).then(([monRes, resRes]) => {
      setInProgress(monRes.data.inProgress);
      setSubmittedCount(monRes.data.submittedCount);
      setSubmitted(resRes.data.results);
    });
  };

  useEffect(() => {
    getExamApi(id).then(({ data }) => { setExam(data.exam); setLoading(false); });
    refresh();
    const interval = setInterval(refresh, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <LoadingSpinner />;

  const elapsed = (startedAt) => {
    const secs = Math.floor((Date.now() - new Date(startedAt)) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Monitor</h1>
          <p className="text-gray-500 text-sm mt-1">{exam?.title}</p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto-refreshing
          </span>
          <button onClick={refresh} className="btn-secondary text-sm">↻ Refresh</button>
          <Link to={`/teacher/exams/${id}/analytics`} className="btn-primary text-sm">View Analytics</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600 animate-pulse">{inProgress.length}</p>
          <p className="text-sm text-gray-500 mt-1">Currently Taking</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{submittedCount}</p>
          <p className="text-sm text-gray-500 mt-1">Submitted</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-700">{inProgress.length + submittedCount}</p>
          <p className="text-sm text-gray-500 mt-1">Total Participants</p>
        </div>
      </div>

      {/* In-progress students */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Students Currently Taking Exam
          {inProgress.length > 0 && <span className="ml-2 badge-blue">{inProgress.length}</span>}
        </h2>
        {inProgress.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No students currently taking this exam.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-xs text-gray-500 uppercase">Student</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Student ID</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Started</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Time Elapsed</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Attempt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inProgress.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{r.student?.name}</td>
                    <td className="py-2.5 text-gray-500">{r.student?.studentId || '-'}</td>
                    <td className="py-2.5 text-gray-500">{new Date(r.startedAt).toLocaleTimeString()}</td>
                    <td className="py-2.5">
                      <span className="font-mono text-sm text-blue-600">{elapsed(r.startedAt)}</span>
                    </td>
                    <td className="py-2.5 text-gray-500">#{r.attemptNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submitted results */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Submitted Results ({submitted.length})</h2>
        {submitted.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-xs text-gray-500 uppercase">Student</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Score</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">%</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Grade</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Status</th>
                  <th className="pb-2 text-xs text-gray-500 uppercase">Grading</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submitted.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{r.student?.name}</td>
                    <td className="py-2.5 text-gray-700">{r.obtainedMarks}/{r.totalMarks}</td>
                    <td className="py-2.5">
                      <span className={`font-bold ${r.isPassed ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                    </td>
                    <td className="py-2.5 font-medium text-gray-700">{r.grade}</td>
                    <td className="py-2.5">
                      <span className={r.isPassed ? 'badge-green' : 'badge-red'}>{r.isPassed ? 'Passed' : 'Failed'}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={r.gradingStatus === 'pending-review' ? 'badge-red' : 'badge-green'}>
                        {r.gradingStatus === 'pending-review' ? 'Pending' : 'Graded'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {r.gradingStatus === 'pending-review' ? (
                        <Link to={`/teacher/grade/${r._id}`} className="text-xs btn-primary py-1 px-2">Grade</Link>
                      ) : (
                        <Link to={`/results/${r._id}`} className="text-xs text-primary-600 hover:underline">View</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamMonitor;
