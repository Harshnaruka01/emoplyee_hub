import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://emoplyee-hub-zwwj.vercel.app/api');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add Authorization token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eh_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Employee services
export const publicSearch = async (query) => {
  const response = await api.get(`/employees/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

export const getAllEmployees = async (search = '') => {
  const response = await api.get(`/employees?search=${encodeURIComponent(search)}`);
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/employees/${id}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

export const uploadPhoto = async (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  
  const response = await api.post('/employees/upload-photo', formData);
  return response.data;
};

export const importEmployees = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/employees/import', formData);
  return response.data;
};

export const exportEmployees = async () => {
  const response = await api.get('/employees/export', {
    responseType: 'blob', // critical for binary file downloads
  });
  
  // Trigger file download in browser
  const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `employees_export_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
export { API_BASE_URL };
