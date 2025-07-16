import axios, { AxiosInstance } from 'axios';
// import crypto from 'crypto-js';

// const API_SECRET = import.meta.env.VITE_API_SECRET;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const generateSignature = (url: string, body: string, timestamp: number) => {
//     const dataToSign = `${url}|${body}|${timestamp}`;
//     return crypto.HmacSHA256(dataToSign, API_SECRET).toString();
// };

export const apiInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiInstance.interceptors.request.use((config) => {
    const token = JSON.parse(localStorage.getItem('token') || '{}');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const timestamp = Date.now();
    // const fullUrl = `${config.baseURL}${config.url}`;
    // const bodyString = JSON.stringify(config.data || {});
    // const signature = generateSignature(fullUrl, bodyString, timestamp);

    config.headers['X-Timestamp'] = timestamp.toString();
    // config.headers['X-Signature'] = signature;

    return config;
}, (error) => {
    return Promise.reject(error);
});

apiInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Network error:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export const getSettings = () => apiInstance.get('/api/settings').then(r => r.data);
export const updateSettings = (data: any) => apiInstance.put('/api/settings', data).then(r => r.data);

export const getSubscription = () => apiInstance.get('/api/subscription').then(r => r.data);
export const updateSubscription = (data: any) => apiInstance.put('/api/subscription', data).then(r => r.data);

export const getProfile = () => apiInstance.get('/api/profile').then(r => r.data);
export const updateProfile = (data: any) => apiInstance.put('/api/profile', data).then(r => r.data);

export const getTemplates = () => apiInstance.get('/api/templates').then(r => r.data);
export const createTemplate = (data: any) => apiInstance.post('/api/templates', data).then(r => r.data);
export const updateTemplate = (id: string, data: any) => apiInstance.put(`/api/templates/${id}`, data).then(r => r.data);
export const deleteTemplate = (id: string) => apiInstance.delete(`/api/templates/${id}`).then(r => r.data);

export const getReports = async () => {
    const { data } = await apiInstance.get('/api/reports');
    return data;
}
export const getReportDetail = (id: string) => apiInstance.get(`/api/reports/${id}`).then(r => r.data);
export const createReport = (data: any) => apiInstance.post('/api/reports', data).then(r => r.data);
export const updateReport = (id: string, data: any) => apiInstance.put(`/api/reports/${id}`, data).then(r => r.data);
export const deleteReport = (id: string) => apiInstance.delete(`/api/reports/${id}`).then(r => r.data);