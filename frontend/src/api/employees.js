import api from './client';

export const listEmployees = () => api.get('/emp/employees').then((r) => r.data);

// Server-side search: filters are combined with the caller's id on the backend
export const searchEmployees = (params) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v && v.trim()));
  return api.get('/emp/employees/search', { params: clean }).then((r) => r.data);
};

export const getEmployee = (id) => api.get(`/emp/employees/${id}`).then((r) => r.data);
export const createEmployee = (data) => api.post('/emp/employees', data).then((r) => r.data.employee);
export const updateEmployee = ({ id, data }) => api.put(`/emp/employees/${id}`, data).then((r) => r.data.employee);
export const deleteEmployee = (id) => api.delete('/emp/employees', { params: { eid: id } });

export const uploadPicture = ({ id, file }) => {
  const form = new FormData();
  form.append('picture', file);
  return api.post(`/emp/employees/${id}/picture`, form).then((r) => r.data.employee);
};
