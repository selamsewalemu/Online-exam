import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

const ROLE_COLOR = { admin: 'bg-purple-100 text-purple-700', teacher: 'bg-green-100 text-green-700', student: 'bg-blue-100 text-blue-700' };

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isTeacher = user?.role === 'teacher';

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  const navLinks = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/exams', label: 'Exams' },
        { to: '/admin/results', label: 'Results' },
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/org', label: 'Organization' },
      ]
    : isTeacher
    ? [
        { to: '/teacher/dashboard', label: 'Dashboard' },
        { to: '/teacher/exams', label: 'My Exams' },
        { to: '/teacher/question-bank', label: 'Question Bank' },
        { to: '/teacher/results', label: 'Results' },
        { to: '/teacher/grading', label: 'Grading' },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/exams', label: 'Exams' },
        { to: '/my-results', label: 'My Results' },
      ];

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={isAdmin ? '/admin/dashboard' : isTeacher ? '/teacher/dashboard' : '/dashboard'}
              className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EP</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg hidden sm:block">ExamPortal</span>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(to) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-medium text-gray-900">{user?.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${ROLE_COLOR[user?.role]}`}>{user?.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="hidden md:block btn-secondary text-sm py-1.5 px-3">Logout</button>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100">
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <span className={`text-xs capitalize font-medium ${ROLE_COLOR[user?.role]}`}>{user?.role}</span>
              </div>
            </div>
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive(to) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                {label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md mt-1">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
