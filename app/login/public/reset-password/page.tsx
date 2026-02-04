'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Loader2, AlertCircle, Zap, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { updatePassword, supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check if user has a valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // The user should have a session from clicking the reset link
            if (session) {
                setIsValidSession(true);
            }
            setChecking(false);
        };

        // Listen for auth state changes (when user clicks reset link)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true);
                setChecking(false);
            }
        });

        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await updatePassword(password);

            if (updateError) {
                setError(updateError.message);
                setLoading(false);
                return;
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('Password update error:', err);
            setError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Loading state while checking session
    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Invalid session - no reset link clicked
    if (!isValidSession && !success) {
        return (
            <div className="relative min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="w-full flex flex-col items-center justify-center px-6 py-12">
                    <div className="w-full max-w-[420px]">
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-3">Invalid Reset Link</h1>
                            <p className="text-slate-500 mb-6">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Link
                                href="/login/public/forgot-password"
                                className="inline-flex items-center justify-center w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/25 transition-all"
                            >
                                Request New Link
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="relative min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="w-full flex flex-col items-center justify-center px-6 py-12">
                    <div className="w-full max-w-[420px]">
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-3">Password Updated!</h1>
                            <p className="text-slate-500 mb-6">
                                Your password has been successfully updated. You can now sign in with your new password.
                            </p>
                            <Link
                                href="/login/public"
                                className="inline-flex items-center justify-center w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/25 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-white to-blue-50/30">

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-1/2 min-h-screen relative overflow-hidden items-center justify-center p-12 lg:p-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col items-start gap-10 max-w-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Zap className="w-7 h-7 text-white fill-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">FixCity</h1>
                            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">New Password</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-white text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                            Create a new<br />
                            <span className="text-blue-200">password</span>
                        </h2>
                        <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">
                            Choose a strong password to keep your account secure.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 min-h-screen">

                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center lg:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-800">FixCity</span>
                    </div>
                </div>

                <div className="absolute top-0 right-0 p-6 lg:p-8">
                    <Link href="/login/public" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Back</span>
                    </Link>
                </div>

                <div className="w-full max-w-[420px]">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Set New Password</h1>
                            <p className="text-slate-500 text-sm">
                                Enter your new password below
                            </p>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="password">New Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-12 pr-12 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        placeholder="At least 6 characters"
                                        required
                                        disabled={loading}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="confirmPassword">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        placeholder="Confirm your password"
                                        required
                                        disabled={loading}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    <p className="text-sm font-medium text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-slate-400 text-xs mt-6">
                        © 2026 FixCity Governance Systems
                    </p>
                </div>
            </div>
        </div>
    );
}
