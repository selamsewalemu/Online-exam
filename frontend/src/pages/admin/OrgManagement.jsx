import { useEffect, useState } from 'react';
import {
  getDepartmentsApi, createDepartmentApi, updateDepartmentApi, deleteDepartmentApi,
  getClassesApi, createClassApi, deleteClassApi,
  getCoursesApi, createCourseApi, deleteCourseApi,
} from '../../api/orgApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
    {label}
  </button>
);

const OrgManagement = () => {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depForm, setDepForm] = useState({ name: '', code: '', description: '' });
  const [classForm, setClassForm] = useState({ name: '', code: '', department: '', academicYear: '2025-2026', semester: 'Fall' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', department: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getDepartmentsApi(), getClassesApi(), getCoursesApi()]).then(([dRes, cRes, coRes]) => {
      setDepartments(dRes.data.departments);
      setClasses(cRes.data.classes);
      setCourses(coRes.data.courses);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreateDep = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createDepartmentApi(depForm);
      toast.success('Department created'); load();
      setDepForm({ name: '', code: '', description: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteDep = async (id) => {
    if (!confirm('Delete department?')) return;
    try { await deleteDepartmentApi(id); setDepartments(p => p.filter(d => d._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createClassApi(classForm); toast.success('Class created'); load();
      setClassForm({ name: '', code: '', department: '', academicYear: '2025-2026', semester: 'Fall' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Delete class?')) return;
    try { await deleteClassApi(id); setClasses(p => p.filter(c => c._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createCourseApi(courseForm); toast.success('Course created'); load();
      setCourseForm({ name: '', code: '', department: '', description: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete course?')) return;
    try { await deleteCourseApi(id); setCourses(p => p.filter(c => c._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Organization Management</h1>
      <div className="flex gap-2 mb-6">
        <Tab label={`Departments (${departments.length})`} active={tab === 'departments'} onClick={() => setTab('departments')} />
        <Tab label={`Classes (${classes.length})`} active={tab === 'classes'} onClick={() => setTab('classes')} />
        <Tab label={`Courses (${courses.length})`} active={tab === 'courses'} onClick={() => setTab('courses')} />
      </div>

      {/* DEPARTMENTS */}
      {tab === 'departments' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Add Department</h2>
            <form onSubmit={handleCreateDep} className="space-y-3">
              <input required value={depForm.name} onChange={e => setDepForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="Department Name *" />
              <input value={depForm.code} onChange={e => setDepForm(f => ({...f, code: e.target.value}))} className="input-field" placeholder="Code (e.g. CS)" />
              <input value={depForm.description} onChange={e => setDepForm(f => ({...f, description: e.target.value}))} className="input-field" placeholder="Description" />
              <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Add Department'}</button>
            </form>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Departments</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {departments.map(d => (
                <div key={d._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{d.name}</p>
                    {d.code && <p className="text-xs text-gray-400">{d.code}</p>}
                  </div>
                  <button onClick={() => handleDeleteDep(d._id)} className="text-xs btn-danger py-1 px-2">Del</button>
                </div>
              ))}
              {departments.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No departments yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* CLASSES */}
      {tab === 'classes' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Add Class</h2>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <input required value={classForm.name} onChange={e => setClassForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="Class Name *" />
              <input value={classForm.code} onChange={e => setClassForm(f => ({...f, code: e.target.value}))} className="input-field" placeholder="Class Code" />
              <select value={classForm.department} onChange={e => setClassForm(f => ({...f, department: e.target.value}))} className="input-field">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <input value={classForm.academicYear} onChange={e => setClassForm(f => ({...f, academicYear: e.target.value}))} className="input-field" placeholder="Academic Year" />
              <select value={classForm.semester} onChange={e => setClassForm(f => ({...f, semester: e.target.value}))} className="input-field">
                <option>Fall</option><option>Spring</option><option>Summer</option>
              </select>
              <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Add Class'}</button>
            </form>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Classes</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {classes.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.department?.name} · {c.students?.length ?? 0} students</p>
                  </div>
                  <button onClick={() => handleDeleteClass(c._id)} className="text-xs btn-danger py-1 px-2">Del</button>
                </div>
              ))}
              {classes.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No classes yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* COURSES */}
      {tab === 'courses' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Add Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <input required value={courseForm.name} onChange={e => setCourseForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="Course Name *" />
              <input value={courseForm.code} onChange={e => setCourseForm(f => ({...f, code: e.target.value}))} className="input-field" placeholder="Course Code" />
              <select value={courseForm.department} onChange={e => setCourseForm(f => ({...f, department: e.target.value}))} className="input-field">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <input value={courseForm.description} onChange={e => setCourseForm(f => ({...f, description: e.target.value}))} className="input-field" placeholder="Description" />
              <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Add Course'}</button>
            </form>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Courses</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {courses.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.code} · {c.department?.name}</p>
                  </div>
                  <button onClick={() => handleDeleteCourse(c._id)} className="text-xs btn-danger py-1 px-2">Del</button>
                </div>
              ))}
              {courses.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No courses yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgManagement;
