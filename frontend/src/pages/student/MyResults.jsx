import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyResultsApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyResultsApi()
      .then(({ data }) => setResults(data.results))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading results..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-500 text-sm mt-1">All your exam submissions.</p>
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-500">No results yet. Take an exam to see your results here!</p>
          <Link to="/exams" className="btn-primary mt-4 inline-flex">Browse Exams</Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Exam', 'Subject', 'Score', 'Percentage', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((result) => (
                <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{result.exam?.title}</td>
                  <td className="px-4 py-3 text-gray-500">{result.exam?.subject}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {result.obtainedMarks}/{result.totalMarks}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${result.isPassed ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-700">{result.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={result.isPassed ? 'badge-green' : 'badge-red'}>
                      {result.isPassed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(result.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/results/${result._id}`} className="text-primary-600 text-xs font-medium hover:underline">
                      View Details →
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

export default MyResults;
