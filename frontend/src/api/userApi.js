import api from './axios';

export const getUsersApi = (params) => api.get('/users', { params });
export const getUserApi = (id) => api.get(`/users/${id}`);
export const createUserApi = (data) => api.post('/users', data);
export const toggleUserStatusApi = (id) => api.put(`/users/${id}/toggle-status`);
export const updateUserRoleApi = (id, role) => api.put(`/users/${id}/role`, { role });
export const resetPasswordApi = (id, newPassword) => api.put(`/users/${id}/reset-password`, { newPassword });
export const getUserActivityApi = (id) => api.get(`/users/${id}/activity`);
