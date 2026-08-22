import api from './axios';

export const getExamsApi = () => api.get('/exams');
export const getExamApi = (id) => api.get(`/exams/${id}`);
export const createExamApi = (data) => api.post('/exams', data);
export const importExamApi = (file) => {
	const data = new FormData();
	data.append('file', file);
	return api.post('/exams/import', data, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const updateExamApi = (id, data) => api.put(`/exams/${id}`, data);
export const deleteExamApi = (id) => api.delete(`/exams/${id}`);
export const getExamQuestionsApi = (id) => api.get(`/exams/${id}/questions`);
export const getExamStatsApi = () => api.get('/exams/stats');
export const monitorExamApi = (id) => api.get(`/exams/${id}/monitor`);
