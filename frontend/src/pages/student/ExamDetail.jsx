import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamApi } from '../../api/examApi';
import { startExamApi, getMyResultsApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [pastAttempts, setPastAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([getExamApi(id), getMyResultsApi()]).then(([examRes, resultRes]) => {
      setExam(examRes.data.exam);
      const attempts = resultRes.data.results.filter((r) => r.exam?._id === id).length;
      setPastAttempts(attempts);
      setLoading(false);
    });
  }, [id]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const { data } = await startExamApi(id);
      navigate(`/exam/${id}/take/${data.result._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start exam');
      setStarting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading exam..." />;
  if (!exam) return <p className="text-center py-12 text-gray-500">Exam not found.</p>;

  const canAttempt = pastAttempts < exam.maxAttempts;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-blue">{exam.subject}</span>
          {exam.category && <span className="badge-gray">{exam.category}</span>}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
        {exam.description && <p className="text-gray-500 mt-2">{exam.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Duration', value: `${exam.duration} min` },
            { label: 'Total Marks', value: exam.totalMarks },
            { label: 'Passing Marks', value: exam.passingMarks },
            { label: 'Max Attempts', value: exam.maxAttempts },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary-600">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {exam.instructions && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Instructions</h3>
            <p className="text-sm text-yellow-700 whitespace-pre-line">{exam.instructions}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 space-y-1">
          <p>• You have used <strong>{pastAttempts}</strong> of <strong>{exam.maxAttempts}</strong> attempt(s).</p>
          {exam.shuffleQuestions && <p>• Questions will be shuffled for this attempt.</p>}
          <p>• Do not close or refresh the browser during the exam.</p>
          <p>• Submit before the timer runs out.</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
          <button
            onClick={handleStart}
            disabled={!canAttempt || starting}
            className="btn-primary flex-1"
          >
            {starting ? 'Starting...' : canAttempt ? 'Start Exam' : 'No Attempts Left'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;
