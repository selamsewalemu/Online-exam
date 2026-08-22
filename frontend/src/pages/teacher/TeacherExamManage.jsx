import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExamApi, getExamQuestionsApi } from '../../api/examApi';
import { createQuestionApi, updateQuestionApi, deleteQuestionApi, addBankQuestionToExamApi, getBankQuestionsApi } from '../../api/questionApi';
import QuestionForm from '../../components/QuestionForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DIFF_BADGE = { easy: 'badge-green', medium: 'text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded-full text-xs font-medium', hard: 'badge-red' };

const TeacherExamManage = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showBank, setShowBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankSearch, setBankSearch] = useState('');

  const load = () => {
    Promise.all([getExamApi(id), getExamQuestionsApi(id)]).then(([examRes, qRes]) => {
      setExam(examRes.data.exam);
      setQuestions(qRes.data.questions);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const loadBank = (search = '') => {
    getBankQuestionsApi({ search, limit: 20 }).then(({ data }) => setBankQuestions(data.questions));
  };

  const openBank = () => { setShowBank(true); loadBank(); };

  const handleSaveQuestion = async (form) => {
    try {
      if (editing) {
        const { data } = await updateQuestionApi(editing._id, form);
        setQuestions(prev => prev.map(q => q._id === editing._id ? data.question : q));
        toast.success('Question updated');
      } else {
        const { data } = await createQuestionApi({ ...form, exam: id });
        setQuestions(prev => [...prev, data.question]);
        toast.success('Question added');
      }
      setShowForm(false); setEditing(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (qId) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestionApi(qId);
      setQuestions(prev => prev.filter(q => q._id !== qId));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const handleAddFromBank = async (bankQId) => {
    try {
      const { data } = await addBankQuestionToExamApi(bankQId, id);
      setQuestions(prev => [...prev, data.question]);
      toast.success('Question added from bank');
    } catch { toast.error('Failed to add'); }
  };

  if (loading) return <LoadingSpinner />;
  if (!exam) return <p className="text-center py-12 text-gray-500">Exam not found.</p>;

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const easyCount = questions.filter(q => q.difficultyLevel === 'easy').length;
  const medCount = questions.filter(q => q.difficultyLevel === 'medium').length;
  const hardCount = questions.filter(q => q.difficultyLevel === 'hard').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Exam header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex gap-2 mb-1">
              <span className={exam.isPublished ? 'badge-green' : 'badge-gray'}>{exam.isPublished ? 'Published' : 'Draft'}</span>
              <span className="badge-blue">{exam.subject}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span>⏱ {exam.duration} min</span>
              <span>❓ {questions.length} questions</span>
              <span>📊 {totalMarks} marks (pass: {exam.passingMarks})</span>
              <span className="text-green-600">Easy questions: {easyCount}</span>
              <span className="text-yellow-600">Medium questions: {medCount}</span>
              <span className="text-red-600">Hard questions: {hardCount}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/teacher/exams/${id}/edit`} className="btn-secondary text-sm">Edit Settings</Link>
            <Link to={`/teacher/exams/${id}/analytics`} className="btn-secondary text-sm">Analytics</Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Questions ({questions.length})</h2>
        <div className="flex gap-2">
          <button onClick={openBank} className="btn-secondary text-sm">📚 From Bank</button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary text-sm">+ New Question</button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="card text-center py-12 mb-6">
          <p className="text-4xl mb-3">❓</p>
          <p className="text-gray-500 mb-4">No questions yet.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={openBank} className="btn-secondary">Add from Bank</button>
            <button onClick={() => setShowForm(true)} className="btn-primary">New Question</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {questions.map((q, i) => (
            <div key={q._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <span className={DIFF_BADGE[q.difficultyLevel]}>{q.difficultyLevel}</span>
                      <span className="badge-blue">{q.questionType}</span>
                      <span className="badge-gray">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                    {['single','multiple','truefalse'].includes(q.questionType) && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {q.options.map(opt => (
                          <span key={opt._id} className={`text-xs px-2 py-0.5 rounded ${opt.isCorrect ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                            {opt.isCorrect ? '✓ ' : ''}{opt.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditing(q); setShowForm(true); }} className="text-xs btn-secondary py-1 px-2">Edit</button>
                  <button onClick={() => handleDelete(q._id)} className="text-xs btn-danger py-1 px-2">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{editing ? 'Edit Question' : 'Add Question'}</h2>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <QuestionForm initial={editing} onSave={handleSaveQuestion}
                onCancel={() => { setShowForm(false); setEditing(null); }} />
            </div>
          </div>
        </div>
      )}

      {/* Bank Picker Modal */}
      {showBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Pick from Question Bank</h2>
                <button onClick={() => setShowBank(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <input value={bankSearch}
                onChange={e => { setBankSearch(e.target.value); loadBank(e.target.value); }}
                placeholder="Search bank..." className="input-field mb-4" />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bankQuestions.map(q => (
                  <div key={q._id} className="flex items-start justify-between gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-1.5 mb-1">
                        <span className={DIFF_BADGE[q.difficultyLevel]}>{q.difficultyLevel}</span>
                        <span className="badge-blue text-xs">{q.questionType}</span>
                        {q.subject && <span className="badge-gray text-xs">{q.subject}</span>}
                      </div>
                      <p className="text-sm text-gray-900 truncate">{q.questionText}</p>
                    </div>
                    <button onClick={() => handleAddFromBank(q._id)}
                      className="btn-primary text-xs py-1 px-3 flex-shrink-0">Add</button>
                  </div>
                ))}
                {bankQuestions.length === 0 && <p className="text-center text-gray-400 py-6">No bank questions found.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExamManage;
