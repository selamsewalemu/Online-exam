import api from './axios';

export const getNotificationsApi = () => api.get('/notifications');
export const markAllReadApi = () => api.put('/notifications/read-all');
export const markReadApi = (id) => api.put(`/notifications/${id}/read`);
