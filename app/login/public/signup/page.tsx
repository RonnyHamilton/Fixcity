'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, User, Loader2, AlertCircle, Zap, CheckCircle, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { signUp, supabase } from '@/lib/supabase';

export default function PublicSignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name.trim() || name.trim().length < 2) {
            setError('Please enter your full name (at least 2 characters)');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

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
            const trimmedName = name.trim();
            const trimmedEmail = email.trim().toLowerCase();

            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await signUp(trimmedEmail, password);

            if (authError) {
                if (authError.message.includes('already registered')) {
                    setError('This email is already registered. Please sign in instead.');
                } else {
                    setError(authError.message);
                }
                setLoading(false);
                return;
            }

            if (!authData.user) {
                setError('Failed to create account. Please try again.');
                setLoading(false);
                return;
            }

            // 2. Create entry in public_users table
            const { error: dbError } = await supabase
                .from('public_users')
                .insert({
                    id: authData.user.id,
                    name: trimmedName,
                    email: trimmedEmail,
                });

            if (dbError) {
                console.error('Database error:', dbError);
                // Don't fail completely - Auth account was created
            }

            setSuccess(true);

        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="w-full flex flex-col items-center justify-center px-6 py-12">
                    <div className="w-full max-w-[420px]">
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-3">Account Created!</h1>
                            <p className="text-slate-500 mb-6">
                                Please check your email to verify your account before signing in.
                            </p>
                            <Link
                                href="/login/public"
                                className="inline-flex items-center justify-center w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/25 transition-all"
                            >
                                Go to Sign In
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
                {/* Decorative Pattern */}
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

                {/* Floating Circles */}
                <div className="absolute top-20 right-20 w-32 h-32 border border-white/20 rounded-full" />
                <div className="absolute bottom-32 left-16 w-24 h-24 border border-white/10 rounded-full" />

                <div className="relative z-10 flex flex-col items-start gap-10 max-w-lg">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Zap className="w-7 h-7 text-white fill-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">FixCity</h1>
                            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Create Account</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <div>
                        <h2 className="text-white text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                            Join the<br />
                            <span className="text-blue-200">Movement.</span>
                        </h2>
                        <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">
                            Create your account and start making a difference in your community today.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4 pt-8 border-t border-white/10 w-full">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span className="text-blue-100">Report civic issues instantly</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span className="text-blue-100">Track resolution progress</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span className="text-blue-100">Get updates on your reports</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Signup Form */}
            <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 min-h-screen">

                {/* Mobile Logo */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center lg:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-800">FixCity</span>
                    </div>
                </div>

                {/* Back Button */}
                <div className="absolute top-0 right-0 p-6 lg:p-8">
                    <Link href="/login/public" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Back</span>
                    </Link>
                </div>

                <div className="w-full max-w-[420px]">
                    {/* Form Card */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">

                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <User className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h1>
                            <p className="text-slate-500 text-sm">
                                Sign up to start reporting issues
                            </p>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="name">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        placeholder="Enter your full name"
                                        required
                                        disabled={loading}
                                        minLength={2}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="email">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        placeholder="your.email@example.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
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
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Sign In Link */}
                        <p className="text-center text-slate-500 text-sm mt-6">
                            Already have an account?{' '}
                            <Link href="/login/public" className="text-blue-600 font-semibold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-slate-400 text-xs mt-6">
                        © 2026 FixCity Governance Systems
                    </p>
                </div>
            </div>
        </div>
    );
}
