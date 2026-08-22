import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createExamApi, getExamApi, updateExamApi } from '../../api/examApi';
import { getCoursesApi } from '../../api/orgApi';
import { getClassesApi } from '../../api/orgApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY = {
  title: '', description: '', subject: '', category: 'General',
  course: '', assignedClasses: [],
  duration: 30, passingMarks: 40, maxAttempts: 1,
  instructions: '', shuffleQuestions: false, shuffleOptions: false,
  isPublished: false, allowReview: true, showResultImmediately: true,
  browserRestriction: false,
  scheduledStart: '', scheduledEnd: '',
};

const ExamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCoursesApi(), getClassesApi()]).then(([cRes, clRes]) => {
      setCourses(cRes.data.courses);
      setClasses(clRes.data.classes);
    });
    if (!isEdit) return;
    getExamApi(id).then(({ data }) => {
      const e = data.exam;
      setForm({
        title: e.title, description: e.description, subject: e.subject,
        category: e.category, course: e.course?._id || '',
        assignedClasses: (e.assignedClasses || []).map(c => c._id || c),
        duration: e.duration, passingMarks: e.passingMarks, maxAttempts: e.maxAttempts,
        instructions: e.instructions, shuffleQuestions: e.shuffleQuestions,
        shuffleOptions: e.shuffleOptions, isPublished: e.isPublished,
        allowReview: e.allowReview, showResultImmediately: e.showResultImmediately,
        browserRestriction: e.browserRestriction,
        scheduledStart: e.scheduledStart ? e.scheduledStart.slice(0, 16) : '',
        scheduledEnd: e.scheduledEnd ? e.scheduledEnd.slice(0, 16) : '',
      });
      setLoading(false);
    });
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleClass = (classId) => {
    setForm(f => ({
      ...f,
      assignedClasses: f.assignedClasses.includes(classId)
        ? f.assignedClasses.filter(id => id !== classId)
        : [...f.assignedClasses, classId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const base = isAdmin ? '/admin' : '/teacher';
      if (isEdit) {
        const { data } = await updateExamApi(id, form);
        toast.success('Exam updated');
        navigate(`${base}/exams/${data.exam._id}`);
      } else {
        const { data } = await createExamApi(form);
        toast.success('Exam created! Now add questions.');
        navigate(`${base}/exams/${data.exam._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input-field" placeholder="Exam title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input name="subject" value={form.subject} onChange={handleChange} required className="input-field" placeholder="e.g. Web Development" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input name="category" value={form.category} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select name="course" value={form.course} onChange={handleChange} className="input-field">
                <option value="">Select course (optional)</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {classes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Classes</label>
              <div className="flex flex-wrap gap-2">
                {classes.map(cls => (
                  <label key={cls._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${form.assignedClasses.includes(cls._id) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={form.assignedClasses.includes(cls._id)}
                      onChange={() => toggleClass(cls._id)} className="sr-only" />
                    {cls.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Start</label>
              <input type="datetime-local" name="scheduledStart" value={form.scheduledStart} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule End</label>
              <input type="datetime-local" name="scheduledEnd" value={form.scheduledEnd} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea name="instructions" value={form.instructions} onChange={handleChange} rows={4} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'shuffleQuestions', label: 'Shuffle question order' },
              { name: 'shuffleOptions', label: 'Shuffle answer options' },
              { name: 'allowReview', label: 'Allow answer review before submit' },
              { name: 'showResultImmediately', label: 'Show result immediately after submit' },
              { name: 'browserRestriction', label: 'Enable browser restriction' },
              { name: 'isPublished', label: 'Publish (visible to students)' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="rounded text-primary-600" />
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
