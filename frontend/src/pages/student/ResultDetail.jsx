import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResultApi } from '../../api/resultApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const ResultDetail = () => {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    getResultApi(id).then(({ data }) => setResult(data.result)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading result..." />;
  if (!result) return <p className="text-center py-12 text-gray-500">Result not found.</p>;

  const isOwner = result.student?._id?.toString() === user?._id?.toString();
  const canReview = result.exam?.allowReview && result.answers?.length > 0;
  const mins = Math.floor(result.timeTaken / 60);
  const secs = result.timeTaken % 60;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Score card */}
      <div className={`card text-center mb-6 border-2 ${result.isPassed ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <p className="text-5xl mb-2">{result.isPassed ? '🎉' : '😔'}</p>
        <h1 className="text-2xl font-bold text-gray-900">{result.exam?.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{result.exam?.subject}</p>
        {result.student && !isOwner && (
          <p className="text-sm font-medium text-gray-700 mt-1">Student: {result.student.name}</p>
        )}

        <div className="mt-4 text-5xl font-extrabold" style={{ color: result.isPassed ? '#16a34a' : '#dc2626' }}>
          {result.percentage}%
        </div>
        <div className="flex justify-center gap-2 mt-2">
          <span className={`${result.isPassed ? 'badge-green' : 'badge-red'} text-sm px-4 py-1`}>
            {result.isPassed ? 'PASSED' : 'FAILED'}
          </span>
          {result.grade && <span className="badge-blue text-sm px-4 py-1">{result.grade}</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-sm">
          {[
            { label: 'Score', value: `${result.obtainedMarks}/${result.totalMarks}` },
            { label: 'Pass Mark', value: result.exam?.passingMarks },
            { label: 'Time Taken', value: `${mins}m ${secs}s` },
            { label: 'Grading', value: result.gradingStatus === 'pending-review' ? '⏳ Pending' : '✅ Complete' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white bg-opacity-70 rounded-lg p-2">
              <p className="font-bold text-gray-900">{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overall feedback from teacher */}
      {result.overallFeedback && (
        <div className="card mb-6 border-l-4 border-l-primary-400 bg-primary-50">
          <p className="text-xs font-semibold text-primary-600 mb-1">Teacher Feedback</p>
          <p className="text-sm text-gray-800">{result.overallFeedback}</p>
          {result.gradedBy && (
            <p className="text-xs text-gray-400 mt-1">— {result.gradedBy.name}</p>
          )}
        </div>
      )}

      {/* Pending grading notice */}
      {result.gradingStatus === 'pending-review' && (
        <div className="card mb-6 bg-yellow-50 border border-yellow-200 text-center py-4">
          <p className="text-yellow-700 font-medium">⏳ Some answers are awaiting manual grading</p>
          <p className="text-yellow-600 text-sm mt-1">Your final score will be updated after review.</p>
        </div>
      )}

      {/* Answer review */}
      {canReview && (
        <div className="mb-6">
          <button onClick={() => setShowAnswers(!showAnswers)} className="btn-secondary w-full">
            {showAnswers ? 'Hide Answer Review' : '🔍 Review My Answers'}
          </button>
        </div>
      )}

      {showAnswers && (
        <div className="space-y-4">
          {result.answers.map((answer, i) => {
            const q = answer.question;
            if (!q) return null;
            const isAutoGraded = !answer.needsManualGrading;

            return (
              <div key={i} className={`card border-l-4 ${answer.isCorrect ? 'border-l-green-500' : 'border-l-red-400'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">{answer.isCorrect ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{i + 1}. {q.questionText}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{answer.marksObtained}/{q.marks} marks</span>
                      {answer.manualMarks !== null && answer.manualMarks !== undefined && (
                        <span className="text-xs text-primary-600">Manual: {answer.manualMarks} marks</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* MCQ options */}
                {['single','multiple','truefalse'].includes(q.questionType) && q.options && (
                  <div className="space-y-1 pl-8">
                    {q.options.map(opt => {
                      const selected = answer.selectedOptions?.map(id => id.toString()).includes(opt._id?.toString());
                      const correct = opt.isCorrect;
                      return (
                        <div key={opt._id}
                          className={`text-sm px-3 py-1.5 rounded-md ${correct ? 'bg-green-100 text-green-800 font-medium' : selected && !correct ? 'bg-red-100 text-red-700' : 'text-gray-600'}`}>
                          {correct ? '✓ ' : selected ? '✗ ' : ''}{opt.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text answer */}
                {answer.textAnswer && (
                  <div className="pl-8 mt-2">
                    <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                    <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded whitespace-pre-wrap">{answer.textAnswer}</p>
                  </div>
                )}

                {/* Per-question feedback */}
                {answer.feedback && (
                  <div className="pl-8 mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Feedback: </p>
                    <p className="text-xs text-blue-800">{answer.feedback}</p>
                  </div>
                )}

                {q.explanation && (
                  <p className="pl-8 mt-2 text-xs text-gray-500 italic">💡 {q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link to="/my-results" className="btn-secondary flex-1 text-center">All Results</Link>
        <Link to="/exams" className="btn-primary flex-1 text-center">Take Another Exam</Link>
      </div>
    </div>
  );
};

export default ResultDetail;
