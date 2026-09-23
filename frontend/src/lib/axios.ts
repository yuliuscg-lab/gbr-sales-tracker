import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error:AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?:boolean};
        
        const isAuthEndPoint =  originalRequest?.url?.includes("/auth/refresh") || 
                                originalRequest?.url?.includes("auth/logout");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndPoint) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.data.accessToken;
                useAuthStore.getState().setAccessToken(newAccessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                return api(originalRequest);

            } catch (refreshError) {
                useAuthStore.getState().clearAuth();

                if (window.location.pathname !== "/") {
                    window.location.href = "/login";
                }

                return Promise.reject(refreshError)
            }
        }
        return Promise.reject(error);
    }
);
