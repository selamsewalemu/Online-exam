import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllResultsApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllResultsApi().then(({ data }) => setResults(data.results)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading results..." />;

  let filtered = results.filter(r =>
    r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.exam?.title?.toLowerCase().includes(search.toLowerCase())
  );
  if (filter === 'pending') filtered = filtered.filter(r => r.gradingStatus === 'pending-review');

  const pendingCount = results.filter(r => r.gradingStatus === 'pending-review').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <p className="text-gray-500 text-sm mt-1">{results.length} total · {pendingCount} pending grading</p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <input type="text" placeholder="Search student or exam..." value={search}
          onChange={e => setSearch(e.target.value)} className="input-field max-w-xs" />
        <div className="flex gap-2">
          {['all', 'pending'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {f === 'all' ? 'All Results' : `Pending Grading (${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-500">No results found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Student', 'Exam', 'Score', '%', 'Grade', 'Status', 'Grading', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.student?.name}</p>
                    <p className="text-xs text-gray-400">{r.student?.studentId}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">{r.exam?.title}</td>
                  <td className="px-4 py-3 text-gray-700">{r.obtainedMarks}/{r.totalMarks}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${r.isPassed ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{r.grade}</td>
                  <td className="px-4 py-3">
                    <span className={r.isPassed ? 'badge-green' : 'badge-red'}>{r.isPassed ? 'Passed' : 'Failed'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.gradingStatus === 'pending-review' ? 'badge-red' : 'badge-green'}>
                      {r.gradingStatus === 'pending-review' ? 'Pending' : 'Graded'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.gradingStatus === 'pending-review' ? (
                      <Link to={`/teacher/grade/${r._id}`} className="text-xs btn-primary py-1 px-2">Grade</Link>
                    ) : (
                      <Link to={`/results/${r._id}`} className="text-xs text-primary-600 hover:underline">View →</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherResults;
