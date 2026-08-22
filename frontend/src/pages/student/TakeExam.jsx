import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamApi, getExamQuestionsApi } from '../../api/examApi';
import { submitExamApi } from '../../api/resultApi';
import QuestionCard from '../../components/QuestionCard';
import Timer from '../../components/Timer';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TakeExam = () => {
  const { examId, resultId } = useParams();
  const navigate = useNavigate();
  const startTimeRef = useRef(Date.now());

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: [optionId, ...] }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const QUESTIONS_PER_PAGE = 5;

  useEffect(() => {
    Promise.all([getExamApi(examId), getExamQuestionsApi(examId)]).then(([examRes, qRes]) => {
      setExam(examRes.data.exam);
      setQuestions(qRes.data.questions);
      setLoading(false);
    });

    // Warn before leaving
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examId]);

  const handleAnswerChange = useCallback((questionId, selectedOptions) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOptions }));
  }, []);

  const buildSubmissionPayload = () => ({
    answers: questions.map((q) => ({
      questionId: q._id,
      selectedOptions: answers[q._id] || [],
    })),
    timeTaken: Math.round((Date.now() - startTimeRef.current) / 1000),
  });

  const handleSubmit = useCallback(
    async (timedOut = false) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const payload = buildSubmissionPayload();
        const { data } = await submitExamApi(resultId, payload);
        toast.success(timedOut ? 'Time up! Exam submitted.' : 'Exam submitted successfully!');
        navigate(`/results/${resultId}`, { replace: true });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Submission failed');
        setSubmitting(false);
      }
    },
    [submitting, answers, questions, resultId, navigate]
  );

  const handleTimeUp = useCallback(() => handleSubmit(true), [handleSubmit]);

  if (loading) return <LoadingSpinner text="Loading exam..." />;
  if (!exam) return <p className="text-center py-12">Exam not found.</p>;

  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length;
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageQuestions = questions.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">{exam.title}</h1>
            <p className="text-xs text-gray-400">
              {answeredCount}/{questions.length} answered
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Timer durationMinutes={exam.duration} onTimeUp={handleTimeUp} />
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="btn-primary text-sm py-1.5"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-primary-600 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {pageQuestions.map((question, idx) => (
          <QuestionCard
            key={question._id}
            question={question}
            index={currentPage * QUESTIONS_PER_PAGE + idx}
            selectedOptions={answers[question._id] || []}
            onChange={handleAnswerChange}
          />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        )}

        {/* Question navigator */}
        <div className="card mt-4">
          <p className="text-xs font-medium text-gray-500 mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const answered = answers[q._id]?.length > 0;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentPage(Math.floor(i / QUESTIONS_PER_PAGE))}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    answered
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            <span className="inline-block w-3 h-3 rounded bg-primary-600 mr-1 align-middle" />
            Answered &nbsp;
            <span className="inline-block w-3 h-3 rounded bg-gray-200 mr-1 align-middle" />
            Not answered
          </p>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;
