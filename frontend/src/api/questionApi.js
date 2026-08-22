import api from './axios';

export const createQuestionApi = (data) => api.post('/questions', data);
export const createBulkQuestionsApi = (data) => api.post('/questions/bulk', data);
export const updateQuestionApi = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestionApi = (id) => api.delete(`/questions/${id}`);
export const getQuestionApi = (id) => api.get(`/questions/${id}`);

// Question bank
export const getBankQuestionsApi = (params) => api.get('/questions/bank', { params });
export const createBankQuestionApi = (data) => api.post('/questions/bank', data);
export const bulkCreateBankQuestionsApi = (data) => api.post('/questions/bank/bulk', data);
export const importBankQuestionsApi = (file) => {
	const data = new FormData();
	data.append('file', file);
	return api.post('/questions/bank/import', data, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const addBankQuestionToExamApi = (id, examId) => api.post(`/questions/bank/${id}/add-to-exam`, { examId });
