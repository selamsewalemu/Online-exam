import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { importExamApi } from '../api/examApi';
import toast from 'react-hot-toast';

const ImportExamButton = ({ basePath = '/teacher' }) => {
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleImport = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const { data } = await importExamApi(file);
      toast.success(`Exam imported with ${data.count} questions`);
      navigate(`${basePath}/exams/${data.exam._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Exam import failed');
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".json,.docx,.rtf,.txt" onChange={handleImport} className="hidden" />
      <button onClick={() => inputRef.current?.click()} className="btn-secondary">Import Exam</button>
    </>
  );
};

export default ImportExamButton;