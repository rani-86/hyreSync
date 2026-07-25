import axios from 'axios';

//const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the saved token to every outgoing request, if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);


export const getJobs = () => api.get('/jobs');
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const createJob = (data) => api.post('/jobs', data);
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data);

export const applyToJob = (jobId) => api.post(`/applications/${jobId}`);
export const getMyApplications = () => api.get('/applications/my');
export const getApplicantsWithFitScores = (jobId) => api.get(`/applications/job/${jobId}/fit-scores`);

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

export default api;