import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllResultsApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllResultsApi()
      .then(({ data }) => setResults(data.results))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading results..." />;

  const filtered = results.filter(
    (r) =>
      r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.exam?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSubmissions = results.length;
  const passRate = results.length
    ? Math.round((results.filter((r) => r.isPassed).length / results.length) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Results</h1>
        <p className="text-gray-500 text-sm mt-1">
          {totalSubmissions} submissions · {passRate}% pass rate
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by student name or exam..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-md"
        />
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
                {['Student', 'Exam', 'Score', '%', 'Status', 'Time Taken', 'Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.student?.name}</p>
                    <p className="text-xs text-gray-400">{r.student?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{r.exam?.title}</td>
                  <td className="px-4 py-3 text-gray-700">{r.obtainedMarks}/{r.totalMarks}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${r.isPassed ? 'text-green-600' : 'text-red-500'}`}>
                      {r.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.isPassed ? 'badge-green' : 'badge-red'}>
                      {r.isPassed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/results/${r._id}`} className="text-primary-600 text-xs font-medium hover:underline">
                      View →
                    </Link>
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

export default AdminResults;
