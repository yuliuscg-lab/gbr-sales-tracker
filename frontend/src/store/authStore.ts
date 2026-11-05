import { create } from "zustand";

export interface UserProfile {
    id: string;
    username: string;
    name:string;
}

interface AuthState {
    accessToken: string | null;
    user:UserProfile | null;
    isInitialized:boolean;
    setAuth: (accessToken: string, user?: UserProfile) => void;
    setAccessToken: (accessToken: string | null) => void;
    logout: () => void;
    setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set)=> ({
    accessToken: null,
    user: null,
    isInitialized: false,

    setAuth: (accessToken, user?:UserProfile) =>
        set({
            accessToken,
            user: user ?? null,
            isInitialized: true,
        }),

    setAccessToken: (token) => set({ accessToken: token }),

    logout: () => 
        set({
            accessToken: null,
            user: null,
            isInitialized: true,
        }),

    setInitialized: (value) => set({ isInitialized: value }),
}));