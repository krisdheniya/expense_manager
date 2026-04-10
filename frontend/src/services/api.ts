import axios from 'axios';

// Create an Axios instance with a base URL
// The user will change the baseURL later to their backend server address
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Example backend URL
});

// Interceptor to attach the JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle global errors like 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Logic to auto-logout the user if their token expires
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
