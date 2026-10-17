import { useAuthStore } from "@/store/authStore";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

const authRefreshApi = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array <{
    resolve: (token:string) => void;
    reject: (error:unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string|null=null)=> {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

//Request Interceptor: Attach current in-memory accessToken
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        if(token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error)=> Promise.reject(error)
);

//Response interceptor: Catch 401 and perform Silent Refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        //If unauthorized and we haven't already retried this request
        if(error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            if (originalRequest.url?.includes('/auth/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject)=> {
                    failedQueue.push({
                        resolve: (token: string) => {
                            if(originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                            }

                            resolve(api(originalRequest));
                        },
                        reject: (err) => reject(err),
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await authRefreshApi.post("/auth/refresh");
                const newAccessToken = res.data.data.accessToken;

                useAuthStore.getState().setAccessToken(newAccessToken);
                processQueue(null, newAccessToken);

                if(originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr,null);
                useAuthStore.getState().logout();

                if(window.location.pathname !== '/login') {
                    window.location.href = 'login';
                }

                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);