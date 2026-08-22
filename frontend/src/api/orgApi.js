import api from './axios';

// Departments
export const getDepartmentsApi = () => api.get('/org/departments');
export const createDepartmentApi = (data) => api.post('/org/departments', data);
export const updateDepartmentApi = (id, data) => api.put(`/org/departments/${id}`, data);
export const deleteDepartmentApi = (id) => api.delete(`/org/departments/${id}`);

// Classes
export const getClassesApi = () => api.get('/org/classes');
export const createClassApi = (data) => api.post('/org/classes', data);
export const updateClassApi = (id, data) => api.put(`/org/classes/${id}`, data);
export const deleteClassApi = (id) => api.delete(`/org/classes/${id}`);
export const manageClassStudentsApi = (id, data) => api.put(`/org/classes/${id}/students`, data);

// Courses
export const getCoursesApi = () => api.get('/org/courses');
export const createCourseApi = (data) => api.post('/org/courses', data);
export const updateCourseApi = (id, data) => api.put(`/org/courses/${id}`, data);
export const deleteCourseApi = (id) => api.delete(`/org/courses/${id}`);
