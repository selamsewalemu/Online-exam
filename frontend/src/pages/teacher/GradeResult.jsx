import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResultApi, gradeResultApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const GradeResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState({});  // { questionId: { manualMarks, feedback } }
  const [overallFeedback, setOverallFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getResultApi(id).then(({ data }) => {
      setResult(data.result);
      // Pre-fill existing manual grades
      const init = {};
      data.result.answers?.forEach(ans => {
        if (ans.needsManualGrading || ans.question?.questionType === 'essay' || ans.question?.questionType === 'shortanswer') {
          init[ans.question?._id] = {
            manualMarks: ans.manualMarks ?? '',
            feedback: ans.feedback || '',
          };
        }
      });
      setGrades(init);
      setOverallFeedback(data.result.overallFeedback || '');
      setLoading(false);
    });
  }, [id]);

  const handleGradeChange = (qId, field, value) => {
    setGrades(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const answersPayload = Object.entries(grades).map(([questionId, { manualMarks, feedback }]) => ({
        questionId,
        manualMarks: Number(manualMarks),
        feedback,
      }));
      await gradeResultApi(id, { answers: answersPayload, overallFeedback });
      toast.success('Result graded and student notified!');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading submission..." />;
  if (!result) return <p className="text-center py-12 text-gray-500">Result not found.</p>;

  const essayAnswers = result.answers?.filter(ans =>
    ans.needsManualGrading ||
    ['essay', 'shortanswer'].includes(ans.question?.questionType)
  );

  const autoAnswers = result.answers?.filter(ans =>
    !ans.needsManualGrading &&
    !['essay', 'shortanswer'].includes(ans.question?.questionType)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Student info */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grade Submission</h1>
            <p className="text-gray-500 text-sm mt-1">{result.exam?.title}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{result.student?.name}</p>
            <p className="text-sm text-gray-400">{result.student?.email}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-bold text-gray-900">{result.obtainedMarks}/{result.totalMarks}</p>
            <p className="text-gray-400 text-xs">Auto-graded Score</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-bold text-gray-900">{result.percentage}%</p>
            <p className="text-gray-400 text-xs">Current Percentage</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="font-bold text-yellow-700">{essayAnswers?.length ?? 0}</p>
            <p className="text-yellow-600 text-xs">Need Manual Grading</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Auto-graded answers summary */}
        {autoAnswers?.length > 0 && (
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Auto-graded Questions</h2>
            <div className="space-y-2">
              {autoAnswers.map((ans, i) => {
                const q = ans.question;
                if (!q) return null;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${ans.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className="text-lg">{ans.isCorrect ? '✅' : '❌'}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{q.questionText}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ans.marksObtained}/{q.marks} marks</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual grading section */}
        {essayAnswers?.length > 0 ? (
          <div className="space-y-4 mb-6">
            <h2 className="font-semibold text-gray-900">Manual Grading</h2>
            {essayAnswers.map((ans, i) => {
              const q = ans.question;
              if (!q) return null;
              const qId = q._id;
              return (
                <div key={i} className="card border-l-4 border-l-yellow-400">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex gap-2 mb-1">
                        <span className="badge-blue">{q.questionType}</span>
                        <span className="badge-gray">{q.marks} marks</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                    </div>
                  </div>

                  {/* Student's answer */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Student's Answer:</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {ans.textAnswer || <span className="italic text-gray-400">No answer provided</span>}
                    </p>
                  </div>

                  {q.correctAnswerText && (
                    <div className="bg-green-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-green-600 mb-1">Model Answer:</p>
                      <p className="text-sm text-green-800">{q.correctAnswerText}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Marks Awarded (max: {q.marks})
                      </label>
                      <input
                        type="number" min={0} max={q.marks} step={0.5}
                        value={grades[qId]?.manualMarks ?? ''}
                        onChange={e => handleGradeChange(qId, 'manualMarks', e.target.value)}
                        required className="input-field text-sm"
                        placeholder={`0 – ${q.marks}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Feedback</label>
                      <input
                        type="text"
                        value={grades[qId]?.feedback || ''}
                        onChange={e => handleGradeChange(qId, 'feedback', e.target.value)}
                        className="input-field text-sm"
                        placeholder="Optional feedback..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card mb-6 bg-green-50 border border-green-200 text-center py-6">
            <p className="text-green-700 font-medium">All questions were auto-graded ✅</p>
            <p className="text-green-600 text-sm mt-1">You can still add overall feedback below.</p>
          </div>
        )}

        {/* Overall feedback */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Overall Feedback to Student</label>
          <textarea
            value={overallFeedback}
            onChange={e => setOverallFeedback(e.target.value)}
            rows={3} className="input-field"
            placeholder="General comments, encouragement, areas to improve..."
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving Grades...' : 'Submit Grades & Notify Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GradeResult;
