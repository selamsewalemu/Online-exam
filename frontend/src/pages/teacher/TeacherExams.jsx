import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExamsApi, deleteExamApi, updateExamApi } from '../../api/examApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import ImportExamButton from '../../components/ImportExamButton';

const STATUS_BADGE = {
  draft: 'badge-gray', active: 'badge-green', scheduled: 'badge-blue',
  completed: 'text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full text-xs font-medium',
  archived: 'badge-gray',
};

const TeacherExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getExamsApi().then(({ data }) => setExams(data.exams)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam and all its data?')) return;
    try {
      await deleteExamApi(id);
      setExams(prev => prev.filter(e => e._id !== id));
      toast.success('Exam deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePublish = async (exam) => {
    try {
      const { data } = await updateExamApi(exam._id, { isPublished: !exam.isPublished });
      setExams(prev => prev.map(e => e._id === exam._id ? data.exam : e));
      toast.success(data.exam.isPublished ? 'Exam published — students can now see it' : 'Exam unpublished');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <LoadingSpinner text="Loading exams..." />;

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
          <p className="text-gray-500 text-sm mt-1">{exams.length} exam(s)</p>
        </div>
        <div className="flex gap-2">
          <ImportExamButton />
          <Link to="/teacher/exams/new" className="btn-primary">+ Create Exam</Link>
        </div>
      </div>

      <input type="text" placeholder="Search exams..." value={search}
        onChange={e => setSearch(e.target.value)} className="input-field max-w-md mb-6" />

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 mb-4">No exams yet.</p>
          <Link to="/teacher/exams/new" className="btn-primary inline-flex">Create First Exam</Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title', 'Subject', 'Duration', 'Questions', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(exam => (
                <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{exam.title}</p>
                    {exam.course && <p className="text-xs text-gray-400">{exam.course.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{exam.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{exam.duration} min</td>
                  <td className="px-4 py-3 text-gray-500">{exam.questionCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[exam.status] || 'badge-gray'}>
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/teacher/exams/${exam._id}`} className="text-xs btn-secondary py-1 px-2">Manage</Link>
                      <Link to={`/teacher/exams/${exam._id}/monitor`} className="text-xs btn-secondary py-1 px-2">Monitor</Link>
                      <button onClick={() => handleTogglePublish(exam)}
                        className={`text-xs py-1 px-2 rounded border transition-colors ${exam.isPublished ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                        {exam.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDelete(exam._id)} className="text-xs btn-danger py-1 px-2">Del</button>
                    </div>
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

export default TeacherExams;
