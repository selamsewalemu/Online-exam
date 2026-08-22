import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ExamCard = ({ exam, onDelete }) => {
  const { isAdmin } = useAuth();

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={exam.isPublished ? 'badge-green' : 'badge-gray'}>
              {exam.isPublished ? 'Published' : 'Draft'}
            </span>
            <span className="badge-blue">{exam.subject}</span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 truncate">{exam.title}</h3>
          {exam.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{exam.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-primary-600">{exam.questionCount ?? 0}</p>
          <p className="text-xs text-gray-500">Questions</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-primary-600">{exam.duration}</p>
          <p className="text-xs text-gray-500">Minutes</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-primary-600">{exam.totalMarks}</p>
          <p className="text-xs text-gray-500">Marks</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {isAdmin ? (
          <>
            <Link to={`/admin/exams/${exam._id}`} className="btn-primary text-sm py-1.5 flex-1">
              Manage
            </Link>
            <button
              onClick={() => onDelete && onDelete(exam._id)}
              className="btn-danger text-sm py-1.5 px-3"
            >
              Delete
            </button>
          </>
        ) : (
          <Link to={`/exams/${exam._id}`} className="btn-primary text-sm py-1.5 flex-1 text-center">
            View Exam
          </Link>
        )}
      </div>
    </div>
  );
};

export default ExamCard;
