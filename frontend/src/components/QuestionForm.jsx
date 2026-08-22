import { useState } from 'react';

const EMPTY = {
  questionText: '', questionType: 'single', marks: 1, difficultyLevel: 'medium',
  subject: '', chapter: '', topic: '', explanation: '',
  options: [
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
  ],
  correctAnswerText: '',
  matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }],
};

const DIFFICULTY_COLORS = { easy: 'text-green-600 bg-green-50', medium: 'text-yellow-600 bg-yellow-50', hard: 'text-red-600 bg-red-50' };

const QuestionForm = ({ initial = null, onSave, onCancel, showBankFields = false }) => {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleOptionChange = (idx, field, value) => {
    setForm(f => {
      const opts = [...f.options];
      opts[idx] = { ...opts[idx], [field]: value };
      if (field === 'isCorrect' && value && f.questionType !== 'multiple') {
        opts.forEach((o, i) => { if (i !== idx) o.isCorrect = false; });
      }
      return { ...f, options: opts };
    });
  };

  const handleMatchingChange = (idx, side, value) => {
    setForm(f => {
      const pairs = [...f.matchingPairs];
      pairs[idx] = { ...pairs[idx], [side]: value };
      return { ...f, matchingPairs: pairs };
    });
  };

  const needsOptions = ['single', 'multiple', 'truefalse'].includes(form.questionType);
  const needsMatching = form.questionType === 'matching';
  const needsText = ['shortanswer', 'essay', 'fillinblank'].includes(form.questionType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsOptions && !form.options.some(o => o.isCorrect))
      return alert('At least one option must be marked correct.');
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
        <textarea value={form.questionText} onChange={e => set('questionText', e.target.value)}
          required rows={3} className="input-field" placeholder="Enter the question..." />
      </div>

      {/* Type + difficulty + marks row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.questionType} onChange={e => set('questionType', e.target.value)} className="input-field">
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
            <option value="truefalse">True / False</option>
            <option value="shortanswer">Short Answer</option>
            <option value="essay">Essay</option>
            <option value="fillinblank">Fill in the Blank</option>
            <option value="matching">Matching</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select value={form.difficultyLevel} onChange={e => set('difficultyLevel', e.target.value)} className="input-field">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
          <input type="number" min={1} value={form.marks}
            onChange={e => set('marks', Number(e.target.value))} className="input-field" />
        </div>
      </div>

      {/* Bank metadata */}
      {showBankFields && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} className="input-field" placeholder="e.g. Web Dev" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
            <input value={form.chapter} onChange={e => set('chapter', e.target.value)} className="input-field" placeholder="e.g. Arrays" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input value={form.topic} onChange={e => set('topic', e.target.value)} className="input-field" placeholder="e.g. Sorting" />
          </div>
        </div>
      )}

      {/* Options for MCQ / TF */}
      {needsOptions && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Options *</label>
            {form.questionType !== 'truefalse' && (
              <button type="button" onClick={() => setForm(f => ({ ...f, options: [...f.options, { text: '', isCorrect: false }] }))}
                className="text-xs text-primary-600 hover:underline">+ Add option</button>
            )}
          </div>
          <div className="space-y-2">
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type={form.questionType === 'multiple' ? 'checkbox' : 'radio'}
                  checked={opt.isCorrect}
                  onChange={e => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                  className="text-primary-600 flex-shrink-0" title="Mark as correct" />
                <input type="text" value={opt.text} required
                  onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                  className="input-field flex-1 text-sm" placeholder={`Option ${idx + 1}`} />
                {form.questionType !== 'truefalse' && form.options.length > 2 && (
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }))}
                    className="text-red-400 hover:text-red-600 text-sm flex-shrink-0">✕</button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {form.questionType === 'multiple' ? 'Check all correct answers' : 'Select the one correct answer'}
          </p>
        </div>
      )}

      {/* Matching pairs */}
      {needsMatching && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Matching Pairs *</label>
            <button type="button"
              onClick={() => setForm(f => ({ ...f, matchingPairs: [...f.matchingPairs, { left: '', right: '' }] }))}
              className="text-xs text-primary-600 hover:underline">+ Add pair</button>
          </div>
          {form.matchingPairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input value={pair.left} onChange={e => handleMatchingChange(idx, 'left', e.target.value)}
                className="input-field flex-1 text-sm" placeholder={`Left ${idx + 1}`} required />
              <span className="text-gray-400">→</span>
              <input value={pair.right} onChange={e => handleMatchingChange(idx, 'right', e.target.value)}
                className="input-field flex-1 text-sm" placeholder={`Right ${idx + 1}`} required />
              {form.matchingPairs.length > 2 && (
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, matchingPairs: f.matchingPairs.filter((_, i) => i !== idx) }))}
                  className="text-red-400 text-sm">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Short answer / fill-in-blank correct answer */}
      {(form.questionType === 'fillinblank' || form.questionType === 'shortanswer') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {form.questionType === 'fillinblank' ? 'Correct Answer (auto-graded)' : 'Model Answer (for manual grading reference)'}
          </label>
          <input value={form.correctAnswerText}
            onChange={e => set('correctAnswerText', e.target.value)}
            className="input-field" placeholder="Expected answer..." />
        </div>
      )}

      {/* Essay hint */}
      {form.questionType === 'essay' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          Essay questions require manual grading after submission.
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (shown after submission)</label>
        <input value={form.explanation} onChange={e => set('explanation', e.target.value)}
          className="input-field" placeholder="Why is this the correct answer?" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? 'Saving...' : (initial ? 'Update Question' : 'Add Question')}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm;
