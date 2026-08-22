import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExamsApi, deleteExamApi, updateExamApi } from '../../api/examApi';
import ExamCard from '../../components/ExamCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import ImportExamButton from '../../components/ImportExamButton';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchExams = () => {
    getExamsApi()
      .then(({ data }) => setExams(data.exams))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExams(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam and all its questions and results?')) return;
    try {
      await deleteExamApi(id);
      toast.success('Exam deleted');
      setExams((prev) => prev.filter((e) => e._id !== id));
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const handleTogglePublish = async (exam) => {
    try {
      const { data } = await updateExamApi(exam._id, { isPublished: !exam.isPublished });
      setExams((prev) => prev.map((e) => (e._id === exam._id ? data.exam : e)));
      toast.success(data.exam.isPublished ? 'Exam published' : 'Exam unpublished');
    } catch {
      toast.error('Failed to update exam');
    }
  };

  if (loading) return <LoadingSpinner text="Loading exams..." />;

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Exams</h1>
          <p className="text-gray-500 text-sm mt-1">{exams.length} total exam(s)</p>
        </div>
        <div className="flex gap-2">
          <ImportExamButton basePath="/admin" />
          <Link to="/admin/exams/new" className="btn-primary">+ Create Exam</Link>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 mb-4">No exams yet.</p>
          <Link to="/admin/exams/new" className="btn-primary inline-flex">Create your first exam</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exam) => (
            <div key={exam._id} className="flex flex-col gap-2">
              <ExamCard exam={exam} onDelete={handleDelete} />
              <button
                onClick={() => handleTogglePublish(exam)}
                className={`text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                  exam.isPublished
                    ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                    : 'border-green-300 text-green-700 hover:bg-green-50'
                }`}
              >
                {exam.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExams;
