import { useEffect, useRef, useState } from 'react';
import { getBankQuestionsApi, createBankQuestionApi, updateQuestionApi, deleteQuestionApi, importBankQuestionsApi } from '../../api/questionApi';
import QuestionForm from '../../components/QuestionForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DIFF_BADGE = { easy: 'badge-green', medium: 'text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded-full text-xs font-medium', hard: 'badge-red' };
const TYPE_LABEL = { single: 'MCQ', multiple: 'Multi', truefalse: 'T/F', shortanswer: 'Short', essay: 'Essay', fillinblank: 'Fill', matching: 'Match' };

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ subject: '', difficulty: '', type: '', search: '' });
  const fileInputRef = useRef(null);

  const load = (f = filters) => {
    setLoading(true);
    getBankQuestionsApi(f).then(({ data }) => {
      setQuestions(data.questions);
      setTotal(data.total);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (key, val) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    load(next);
  };

  const handleSave = async (form) => {
    try {
      if (editing) {
        const { data } = await updateQuestionApi(editing._id, form);
        setQuestions(prev => prev.map(q => q._id === editing._id ? data.question : q));
        toast.success('Question updated');
      } else {
        const { data } = await createBankQuestionApi(form);
        setQuestions(prev => [data.question, ...prev]);
        setTotal(t => t + 1);
        toast.success('Question added to bank');
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question from the bank?')) return;
    try {
      await deleteQuestionApi(id);
      setQuestions(prev => prev.filter(q => q._id !== id));
      setTotal(t => t - 1);
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (q) => {
    setEditing(q);
    setShowForm(true);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const { data } = await importBankQuestionsApi(file);
      toast.success(`${data.count} question${data.count === 1 ? '' : 's'} imported`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-500 text-sm mt-1">{total} questions stored</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".json,.docx,.rtf,.txt" onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">Import File</button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">+ Add Question</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input value={filters.search} onChange={e => handleFilter('search', e.target.value)}
            placeholder="Search..." className="input-field text-sm" />
          <input value={filters.subject} onChange={e => handleFilter('subject', e.target.value)}
            placeholder="Subject..." className="input-field text-sm" />
          <select value={filters.difficulty} onChange={e => handleFilter('difficulty', e.target.value)} className="input-field text-sm">
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={filters.type} onChange={e => handleFilter('type', e.target.value)} className="input-field text-sm">
            <option value="">All Types</option>
            <option value="single">MCQ Single</option>
            <option value="multiple">MCQ Multiple</option>
            <option value="truefalse">True/False</option>
            <option value="shortanswer">Short Answer</option>
            <option value="essay">Essay</option>
            <option value="fillinblank">Fill in Blank</option>
            <option value="matching">Matching</option>
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : questions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500 mb-4">No questions in the bank yet.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add First Question</button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={DIFF_BADGE[q.difficultyLevel]}>{q.difficultyLevel}</span>
                    <span className="badge-blue">{TYPE_LABEL[q.questionType]}</span>
                    {q.subject && <span className="badge-gray">{q.subject}</span>}
                    {q.chapter && <span className="text-xs text-gray-400">{q.chapter}</span>}
                    <span className="text-xs text-gray-400">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{q.questionText}</p>
                  {['single','multiple','truefalse'].includes(q.questionType) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {q.options.map(opt => (
                        <span key={opt._id} className={`text-xs px-2 py-0.5 rounded ${opt.isCorrect ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                          {opt.isCorrect ? '✓ ' : ''}{opt.text}
                        </span>
                      ))}
                    </div>
                  )}
                  {q.difficultyIndex !== null && q.difficultyIndex !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">Difficulty index: {q.difficultyIndex}% correct</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(q)} className="btn-secondary text-xs py-1 px-2">Edit</button>
                  <button onClick={() => handleDelete(q._id)} className="btn-danger text-xs py-1 px-2">Del</button>
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
                <h2 className="text-lg font-semibold">{editing ? 'Edit Question' : 'Add to Question Bank'}</h2>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <QuestionForm
                initial={editing}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditing(null); }}
                showBankFields
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
