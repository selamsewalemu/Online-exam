import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getExamApi, getExamQuestionsApi, deleteExamApi } from '../../api/examApi';
import { createQuestionApi, updateQuestionApi, deleteQuestionApi } from '../../api/questionApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY_QUESTION = {
  questionText: '', questionType: 'single', marks: 1, explanation: '',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
};

const ExamManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qForm, setQForm] = useState(EMPTY_QUESTION);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    Promise.all([getExamApi(id), getExamQuestionsApi(id)]).then(([examRes, qRes]) => {
      setExam(examRes.data.exam);
      setQuestions(qRes.data.questions);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [id]);

  const openAddForm = () => {
    setEditingQuestion(null);
    setQForm(EMPTY_QUESTION);
    setShowForm(true);
  };

  const openEditForm = (q) => {
    setEditingQuestion(q);
    setQForm({
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      explanation: q.explanation || '',
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, _id: o._id })),
    });
    setShowForm(true);
  };

  const handleOptionChange = (idx, field, value) => {
    setQForm((f) => {
      const opts = [...f.options];
      opts[idx] = { ...opts[idx], [field]: value };
      // For single/truefalse, uncheck all others when one is checked
      if (field === 'isCorrect' && value && f.questionType !== 'multiple') {
        opts.forEach((o, i) => { if (i !== idx) o.isCorrect = false; });
      }
      return { ...f, options: opts };
    });
  };

  const addOption = () => setQForm((f) => ({ ...f, options: [...f.options, { text: '', isCorrect: false }] }));
  const removeOption = (idx) => setQForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    const hasCorrect = qForm.options.some((o) => o.isCorrect);
    if (!hasCorrect) return toast.error('At least one option must be marked correct');

    setSaving(true);
    try {
      if (editingQuestion) {
        const { data } = await updateQuestionApi(editingQuestion._id, qForm);
        setQuestions((prev) => prev.map((q) => (q._id === editingQuestion._id ? data.question : q)));
        toast.success('Question updated');
      } else {
        const { data } = await createQuestionApi({ ...qForm, exam: id });
        setQuestions((prev) => [...prev, data.question]);
        toast.success('Question added');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await deleteQuestionApi(qId);
      setQuestions((prev) => prev.filter((q) => q._id !== qId));
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner text="Loading exam..." />;
  if (!exam) return <p className="text-center py-12">Exam not found.</p>;

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Exam header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={exam.isPublished ? 'badge-green' : 'badge-gray'}>
                {exam.isPublished ? 'Published' : 'Draft'}
              </span>
              <span className="badge-blue">{exam.subject}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>{exam.duration} min</span>
              <span>{questions.length} questions</span>
              <span>{totalMarks} total marks</span>
              <span>Pass: {exam.passingMarks}</span>
            </div>
          </div>
          <Link to={`/admin/exams/${id}/edit`} className="btn-secondary text-sm">
            Edit Settings
          </Link>
        </div>
      </div>

      {/* Questions section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Questions ({questions.length})</h2>
        <button onClick={openAddForm} className="btn-primary text-sm">+ Add Question</button>
      </div>

      {questions.length === 0 ? (
        <div className="card text-center py-12 mb-6">
          <p className="text-4xl mb-3">❓</p>
          <p className="text-gray-500 mb-4">No questions yet. Add your first question!</p>
          <button onClick={openAddForm} className="btn-primary">Add Question</button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {questions.map((q, i) => (
            <div key={q._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="badge-blue">{q.questionType}</span>
                      <span className="badge-gray">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt) => (
                        <p key={opt._id} className={`text-xs ${opt.isCorrect ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                          {opt.isCorrect ? '✓ ' : '○ '}{opt.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEditForm(q)} className="text-xs btn-secondary py-1 px-2">Edit</button>
                  <button onClick={() => handleDeleteQuestion(q._id)} className="text-xs btn-danger py-1 px-2">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                  <textarea
                    value={qForm.questionText}
                    onChange={(e) => setQForm((f) => ({ ...f, questionText: e.target.value }))}
                    required rows={3} className="input-field"
                    placeholder="Enter the question..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                    <select
                      value={qForm.questionType}
                      onChange={(e) => setQForm((f) => ({ ...f, questionType: e.target.value }))}
                      className="input-field"
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                      <option value="truefalse">True / False</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                    <input
                      type="number" min={1} value={qForm.marks}
                      onChange={(e) => setQForm((f) => ({ ...f, marks: Number(e.target.value) }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Options *</label>
                    <button type="button" onClick={addOption} className="text-xs text-primary-600 hover:underline">+ Add option</button>
                  </div>
                  <div className="space-y-2">
                    {qForm.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type={qForm.questionType === 'multiple' ? 'checkbox' : 'radio'}
                          checked={opt.isCorrect}
                          onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                          title="Mark as correct"
                          className="text-primary-600"
                        />
                        <input
                          type="text" value={opt.text} required
                          onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                          className="input-field flex-1 text-sm"
                          placeholder={`Option ${idx + 1}`}
                        />
                        {qForm.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Check the radio/checkbox to mark correct answer(s)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
                  <input
                    type="text" value={qForm.explanation}
                    onChange={(e) => setQForm((f) => ({ ...f, explanation: e.target.value }))}
                    className="input-field" placeholder="Explain the correct answer..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Saving...' : editingQuestion ? 'Update' : 'Add Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManage;
