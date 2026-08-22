import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createExamApi, getExamApi, updateExamApi } from '../../api/examApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  title: '', description: '', subject: '', category: 'General',
  duration: 30, passingMarks: 40, maxAttempts: 1,
  instructions: '', shuffleQuestions: false, shuffleOptions: false, isPublished: false,
};

const ExamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getExamApi(id).then(({ data }) => {
      const e = data.exam;
      setForm({
        title: e.title, description: e.description, subject: e.subject,
        category: e.category, duration: e.duration, passingMarks: e.passingMarks,
        maxAttempts: e.maxAttempts, instructions: e.instructions,
        shuffleQuestions: e.shuffleQuestions, shuffleOptions: e.shuffleOptions,
        isPublished: e.isPublished,
      });
      setLoading(false);
    });
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const { data } = await updateExamApi(id, form);
        toast.success('Exam updated');
        navigate(`/admin/exams/${data.exam._id}`);
      } else {
        const { data } = await createExamApi(form);
        toast.success('Exam created! Now add questions.');
        navigate(`/admin/exams/${data.exam._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading exam..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Basic Info</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input-field" placeholder="e.g. JavaScript Fundamentals" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input name="subject" value={form.subject} onChange={handleChange} required className="input-field" placeholder="e.g. Web Development" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input name="category" value={form.category} onChange={handleChange} className="input-field" placeholder="e.g. Programming" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field" placeholder="Brief description of the exam..." />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Settings</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
              <input type="number" name="duration" value={form.duration} onChange={handleChange} min={1} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks *</label>
              <input type="number" name="passingMarks" value={form.passingMarks} onChange={handleChange} min={0} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
              <input type="number" name="maxAttempts" value={form.maxAttempts} onChange={handleChange} min={1} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea name="instructions" value={form.instructions} onChange={handleChange} rows={4} className="input-field" placeholder="Exam rules and instructions for students..." />
          </div>

          <div className="space-y-3">
            {[
              { name: 'shuffleQuestions', label: 'Shuffle question order for each student' },
              { name: 'shuffleOptions', label: 'Shuffle answer options' },
              { name: 'isPublished', label: 'Publish exam immediately (visible to students)' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="rounded text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : isEdit ? 'Update Exam' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamForm;
