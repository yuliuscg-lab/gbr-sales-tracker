import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { loginSchema, LoginFormData } from '../validation/auth.validation';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import logoGbr from '../assets/logo-gbr.png';

export const LoginPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

  // Redirect to previously attempted page, or default to dashboard
    const fromLocation = (location.state as { from?: {pathname: string}})?.from?.pathname;
    const destination = fromLocation && fromLocation !== '/' && fromLocation !== '/login' ? fromLocation : '/dashboard';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null);

        try {
            const response = await authApi.login({
                username: data.username,
                password: data.password,
            });

            // Update Zustand in-memory store
            setAuth(response.data.accessToken, response.data.user);

            navigate(destination, { replace: true });
        } catch (err: unknown) {
            if (err instanceof AxiosError && err.response?.data?.message) {
                // Reads standard message from Express errorHandler (e.g., "Email atau password salah!")
                setServerError(err.response.data.message);
            } else {
                setServerError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
                }
            }
        };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                {/* Brand Card Header */}
                <div className="text-center flex flex-col items-center">
                    <img 
                            src={logoGbr} 
                            alt="Logo Gembira" 
                            className="h-30 w-30 object-contain" 
                        />
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        Sales Tracking System
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Masuk ke panel manajemen penjualan umpan & piutang
                    </p>
                </div>

                {/* Form Container */}
                <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
                    {/* Server Error Alert Banner */}
                    {serverError && (
                        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        {/* Username Input */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                            >
                                Username
                            </label>
                            <div className="relative mt-1.5">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Masukkan username"
                                    {...register('username')}
                                    className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                                        errors.username
                                            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
                                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                    }`}
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                            >
                                Password
                            </label>
                            <div className="relative mt-1.5">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Masukkan password"
                                    {...register('password')}
                                    className={`block w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                                        errors.password
                                            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
                                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    tabIndex={-1}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70 hover:cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Log In</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Security / System Footer */}
                <p className="mt-6 text-center text-xs text-slate-400">
                    GBR Fishing © 2026. All rights reserved.
                </p>
            </div>
        </div>
    );
};