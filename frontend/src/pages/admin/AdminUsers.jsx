import { useEffect, useState } from 'react';
import { getUsersApi, toggleUserStatusApi, updateUserRoleApi, createUserApi } from '../../api/userApi';
import { getDepartmentsApi } from '../../api/orgApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ROLE_BADGE = { admin: 'badge-blue', teacher: 'badge-green', student: 'badge-gray' };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: 'Pass@1234', role: 'student', department: '', studentId: '', employeeId: '' });
  const [creating, setCreating] = useState(false);

  const load = (r = roleFilter, s = search) => {
    getUsersApi({ role: r, search: s }).then(({ data }) => setUsers(data.users)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getDepartmentsApi().then(({ data }) => setDepartments(data.departments));
  }, []);

  const handleToggleStatus = async (user) => {
    try {
      const { data } = await toggleUserStatusApi(user._id);
      setUsers(prev => prev.map(u => u._id === user._id ? data.user : u));
      toast.success(data.message);
    } catch { toast.error('Failed'); }
  };

  const handleRoleChange = async (user, role) => {
    if (!confirm(`Change ${user.name}'s role to ${role}?`)) return;
    try {
      const { data } = await updateUserRoleApi(user._id, role);
      setUsers(prev => prev.map(u => u._id === user._id ? data.user : u));
      toast.success('Role updated');
    } catch { toast.error('Failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createUserApi(createForm);
      toast.success('User created');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} user(s) shown</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">+ Create User</button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="Search name or email..." value={search}
          onChange={e => { setSearch(e.target.value); load(roleFilter, e.target.value); }}
          className="input-field max-w-xs" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); load(e.target.value, search); }}
          className="input-field w-40">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['User', 'Role', 'Department', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      {user.studentId && <p className="text-xs text-gray-400">ID: {user.studentId}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={ROLE_BADGE[user.role]}>{user.role}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{user.department?.name || '-'}</td>
                <td className="px-4 py-3"><span className={user.isActive ? 'badge-green' : 'badge-red'}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => handleToggleStatus(user)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${user.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {user.role === 'student' && (
                      <button onClick={() => handleRoleChange(user, 'teacher')}
                        className="text-xs px-2 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50">
                        → Teacher
                      </button>
                    )}
                    {user.role === 'teacher' && (
                      <>
                        <button onClick={() => handleRoleChange(user, 'admin')}
                          className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50">
                          → Admin
                        </button>
                        <button onClick={() => handleRoleChange(user, 'student')}
                          className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                          → Student
                        </button>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <button onClick={() => handleRoleChange(user, 'teacher')}
                        className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                        → Teacher
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create User</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <input required value={createForm.name} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))}
                  className="input-field" placeholder="Full Name *" />
                <input required type="email" value={createForm.email} onChange={e => setCreateForm(f => ({...f, email: e.target.value}))}
                  className="input-field" placeholder="Email *" />
                <input value={createForm.password} onChange={e => setCreateForm(f => ({...f, password: e.target.value}))}
                  className="input-field" placeholder="Password (default: Pass@1234)" />
                <select value={createForm.role} onChange={e => setCreateForm(f => ({...f, role: e.target.value}))} className="input-field">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={createForm.department} onChange={e => setCreateForm(f => ({...f, department: e.target.value}))} className="input-field">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                {createForm.role === 'student' && (
                  <input value={createForm.studentId} onChange={e => setCreateForm(f => ({...f, studentId: e.target.value}))}
                    className="input-field" placeholder="Student ID" />
                )}
                {createForm.role === 'teacher' && (
                  <input value={createForm.employeeId} onChange={e => setCreateForm(f => ({...f, employeeId: e.target.value}))}
                    className="input-field" placeholder="Employee ID" />
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={creating} className="btn-primary flex-1">{creating ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
