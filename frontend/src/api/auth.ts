import { UserProfile } from "@/store/authStore";
import { api } from "./client";

export interface LoginPayload {
    username: string;
    password: string;
}

export interface AuthResponseData {
    accessToken: string;
    user: UserProfile;
}

export const authApi = {
    async login(payload: LoginPayload) {
        const response = await api.post<{ success: Boolean; data: AuthResponseData}> (
            '/auth/login',
            payload
        );
        return response.data;
    },

    async refresh() {
        const response = await api.post<{success: Boolean, data: AuthResponseData}>(
            '/auth/refresh'
        );
        return response.data;
    },

    async logout() {
        const response = await api.post <{ success: boolean }>('/auth/logout');
        return response.data;
    },
};