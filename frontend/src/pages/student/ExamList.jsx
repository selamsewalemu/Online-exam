import { useEffect, useState } from 'react';
import { getExamsApi } from '../../api/examApi';
import ExamCard from '../../components/ExamCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExamsApi()
      .then(({ data }) => {
        setExams(data.exams);
        setFiltered(data.exams);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(exams.filter((e) => e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)));
  }, [search, exams]);

  if (loading) return <LoadingSpinner text="Loading exams..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Exams</h1>
        <p className="text-gray-500 text-sm mt-1">Browse and start exams below.</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No exams found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exam) => (
            <ExamCard key={exam._id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
