import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto-js';

const API_SECRET = import.meta.env.VITE_API_SECRET;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const generateSignature = (url: string, body: string, timestamp: number) => {
    const dataToSign = `${url}|${body}|${timestamp}`;
    return crypto.HmacSHA256(dataToSign, API_SECRET).toString();
};

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
    const fullUrl = `${config.baseURL}${config.url}`;
    const bodyString = JSON.stringify(config.data || {});
    const signature = generateSignature(fullUrl, bodyString, timestamp);

    config.headers['X-Timestamp'] = timestamp.toString();
    config.headers['X-Signature'] = signature;

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