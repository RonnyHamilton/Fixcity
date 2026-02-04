'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, AlertCircle, Zap, CheckCircle, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn, supabase } from '@/lib/supabase';

export default function PublicLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        if (!password || password.length < 6) {
            setError('Please enter your password (at least 6 characters)');
            return;
        }

        setLoading(true);

        try {
            const trimmedEmail = email.trim().toLowerCase();

            console.log('=== LOGIN ATTEMPT ===');
            console.log('Email:', trimmedEmail);

            // Sign in with Supabase Auth - this validates the password
            const { data: authData, error: authError } = await signIn(trimmedEmail, password);

            console.log('Auth response:', { authData, authError });

            if (authError) {
                console.error('Auth error:', authError);
                if (authError.message.includes('Invalid login credentials')) {
                    setError('Invalid email or password. Please check your credentials or sign up if you don\'t have an account.');
                } else if (authError.message.includes('Email not confirmed')) {
                    setError('Please verify your email before signing in. Check your inbox.');
                } else {
                    setError(authError.message);
                }
                setLoading(false);
                return;
            }

            if (!authData.user) {
                setError('Authentication failed. Please try again.');
                setLoading(false);
                return;
            }

            console.log('Auth successful! User ID:', authData.user.id);

            // Get user ID from auth
            const userId = authData.user.id;
            const userEmail = authData.user.email || trimmedEmail;

            // Ensure user exists in public_users table
            const { data: existingUser } = await supabase
                .from('public_users')
                .select('id')
                .eq('id', userId)
                .single();

            if (!existingUser) {
                console.log('Creating user profile in public_users...');
                const { error: insertError } = await supabase
                    .from('public_users')
                    .insert({
                        id: userId,
                        email: userEmail,
                        name: userEmail.split('@')[0],
                    });

                if (insertError) {
                    console.error('Failed to create user profile:', insertError);
                }
            }

            console.log('Redirecting to dashboard...');
            // Redirect to dashboard
            window.location.replace(`/public/dashboard?uid=${userId}`);

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-white to-blue-50/30">

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />

            {/* Left Panel - Branding & Stats */}
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
                <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-white/5 rounded-full" />

                <div className="relative z-10 flex flex-col items-start gap-10 max-w-lg">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Zap className="w-7 h-7 text-white fill-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">FixCity</h1>
                            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Citizen Portal</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <div>
                        <h2 className="text-white text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                            Report. Track.<br />
                            <span className="text-blue-200">Make Impact.</span>
                        </h2>
                        <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">
                            Join thousands of citizens building better communities through smart civic engagement.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8 pt-8 border-t border-white/10 w-full">
                        <div>
                            <span className="block text-4xl font-black text-white mb-1">12k+</span>
                            <span className="text-sm text-blue-200/80 font-medium">Issues Resolved</span>
                        </div>
                        <div className="w-px h-16 bg-white/20" />
                        <div>
                            <span className="block text-4xl font-black text-white mb-1">98%</span>
                            <span className="text-sm text-blue-200/80 font-medium">Success Rate</span>
                        </div>
                        <div className="w-px h-16 bg-white/20" />
                        <div>
                            <span className="block text-4xl font-black text-white mb-1">24h</span>
                            <span className="text-sm text-blue-200/80 font-medium">Avg Response</span>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                            <Shield className="w-4 h-4 text-blue-200" />
                            <span className="text-xs font-semibold text-blue-100">Secure</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                            <CheckCircle className="w-4 h-4 text-green-300" />
                            <span className="text-xs font-semibold text-blue-100">Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
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
                    <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group">
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
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                            <p className="text-slate-500 text-sm">
                                Sign in to access your dashboard
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
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
                                        placeholder="Enter your password"
                                        required
                                        disabled={loading}
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

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <Link
                                    href="/login/public/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Forgot Password?
                                </Link>
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
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-slate-400">or</span>
                            </div>
                        </div>

                        {/* Sign Up Link */}
                        <Link
                            href="/login/public/signup"
                            className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2"
                        >
                            Create New Account
                        </Link>

                        {/* Terms */}
                        <p className="text-center text-slate-400 text-xs mt-6">
                            By continuing, you agree to FixCity&apos;s{' '}
                            <a className="text-blue-600 hover:underline" href="#">Terms</a> and{' '}
                            <a className="text-blue-600 hover:underline" href="#">Privacy Policy</a>.
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
