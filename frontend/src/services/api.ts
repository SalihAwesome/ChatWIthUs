import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : (BASE_URL.endsWith('/') ? `${BASE_URL}api` : `${BASE_URL}/api`);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


export const authService = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    loginGuest: (name: string) => api.post('/auth/guest', { name }),
    getCurrentUser: () => api.get('/auth/me'),
};

export const requestService = {
    getRequests: (params?: any) => api.get('/requests', { params }),
    getRequest: (id: string) => api.get(`/requests/${id}`),
    createRequest: (data: any) => api.post('/requests', data),
    updateRequest: (id: string, data: any) => api.patch(`/requests/${id}`, data),
    getMessages: (id: string) => api.get(`/requests/${id}/messages`),
    sendMessage: (id: string, content: string) => api.post(`/requests/${id}/messages`, { content }),
    markRead: (id: string) => api.patch(`/requests/${id}/messages/read`),
    deleteRequest: (id: string) => api.delete(`/requests/${id}`),
    deleteAllRequests: () => api.delete('/requests'),
};

export const userService = {
    getUsers: () => api.get('/users'),
    createUser: (data: any) => api.post('/users', data),
    updateUser: (id: string, data: any) => api.patch(`/users/${id}`, data),
    deleteUser: (id: string) => api.delete(`/users/${id}`),
};

export default api;
