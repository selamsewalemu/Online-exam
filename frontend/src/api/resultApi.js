import api from './axios';

export const startExamApi = (examId) => api.post('/results/start', { examId });
export const submitExamApi = (resultId, data) => api.post(`/results/${resultId}/submit`, data);
export const getMyResultsApi = () => api.get('/results/my');
export const getResultApi = (id) => api.get(`/results/${id}`);
export const getExamResultsApi = (examId) => api.get(`/results/exam/${examId}`);
export const getAllResultsApi = (params) => api.get('/results', { params });
export const gradeResultApi = (id, data) => api.post(`/results/${id}/grade`, data);
export const getExamAnalyticsApi = (examId) => api.get(`/results/analytics/${examId}`);
export const getStudentHistoryApi = (studentId = 'me') => api.get(`/results/student/${studentId}/history`);
