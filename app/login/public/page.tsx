'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, User, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PublicLoginPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!name.trim() || name.trim().length < 2) {
            setError('Please enter your full name (at least 2 characters)');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const trimmedName = name.trim();
            const trimmedEmail = email.trim().toLowerCase();

            console.log('=== LOGIN ATTEMPT ===');
            console.log('Name:', trimmedName);
            console.log('Email:', trimmedEmail);

            // 1. Check if user exists
            console.log('Step 1: Checking if user exists...');
            const { data: existingUser, error: selectError } = await supabase
                .from('public_users')
                .select('id')
                .eq('email', trimmedEmail)
                .single();

            console.log('Select result:', { existingUser, selectError });

            let userId = existingUser?.id;

            // 2. If not exists → create
            if (!userId) {
                console.log('Step 2: User not found, creating new user...');
                const { data: newUser, error: insertError } = await supabase
                    .from('public_users')
                    .insert({ name: trimmedName, email: trimmedEmail })
                    .select('id')
                    .single();

                console.log('Insert result:', { newUser, insertError });

                if (insertError) {
                    console.error('Insert failed:', insertError);
                    setError('Failed to create user: ' + insertError.message);
                    setLoading(false);
                    return;
                }

                userId = newUser.id;
            }

            console.log('Step 3: User ID obtained:', userId);

            // 3. HARD REDIRECT (important - no router.push)
            const redirectUrl = `/public/dashboard?uid=${userId}`;
            console.log('Step 4: Redirecting to:', redirectUrl);

            window.location.replace(redirectUrl);

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to log in. Please try again.');
            setLoading(false);
        }
    };

    // NO useEffect guards here - login page must always allow submission

    return (
        <div className="relative min-h-screen w-full flex bg-[#0a0f16] selection:bg-primary/30 selection:text-white">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-1/2 min-h-screen relative overflow-hidden items-center justify-center p-12 lg:p-20 bg-[#0a0f16] border-r border-white/5">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920')`,
                        filter: 'grayscale(0.4) contrast(1.2)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f16]/90 to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow" />

                <div className="relative z-10 flex flex-col items-start gap-8 max-w-lg">
                    <div className="flex flex-col items-start gap-6">
                        <div className="w-20 h-20 flex items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_40px_-5px_var(--primary-glow)] backdrop-blur-sm">
                            <span className="material-symbols-outlined text-5xl">public</span>
                        </div>
                        <div>
                            <h2 className="text-white text-5xl lg:text-7xl font-black tracking-tighter mb-4 leading-tight">
                                Fix<span className="text-primary">City</span>
                            </h2>
                            <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-transparent rounded-full" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-md">
                        Empowering citizens to build a better future. Report issues, track progress, and verify resolutions in real-time.
                    </p>

                    <div className="flex items-center gap-8 mt-4 pt-8 border-t border-white/5 w-full">
                        <div>
                            <span className="block text-3xl font-bold text-white mb-1">12k+</span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Issues Resolved</span>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div>
                            <span className="block text-3xl font-bold text-white mb-1">98%</span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Success Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-12 min-h-screen overflow-y-auto overflow-x-hidden">
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-500/05 rounded-full blur-[140px] pointer-events-none" />

                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center lg:hidden z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-2xl">public</span>
                        </div>
                        <h2 className="text-white text-xl font-bold tracking-tight">FixCity</h2>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-full p-8 flex justify-end items-center hidden lg:flex z-20">
                    <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Portal Selection
                    </Link>
                </div>

                <div className="w-full max-w-[440px] relative z-10">
                    <div className="glass-panel rounded-[2rem] p-8 sm:p-12 flex flex-col gap-8 relative overflow-hidden backdrop-blur-2xl border-white/5">

                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Citizen Access</h1>
                            <p className="text-slate-400 text-sm">
                                Enter your details to track your reports and make a difference.
                            </p>
                        </div>

                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider" htmlFor="name">Full Name</label>
                                <div className="group relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-12 rounded-xl glass-input pl-12 pr-4 text-base font-medium bg-white/5 focus:bg-white/10"
                                        placeholder="Enter your full name"
                                        required
                                        disabled={loading}
                                        minLength={2}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider" htmlFor="email">Email Address</label>
                                <div className="group relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-12 rounded-xl glass-input pl-12 pr-4 text-base font-medium bg-white/5 focus:bg-white/10"
                                        placeholder="your.email@example.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Logging in...</span>
                                    </>
                                ) : (
                                    'Continue to Dashboard'
                                )}
                            </button>
                        </form>


                    </div>

                    <p className="text-center text-slate-500/60 text-xs mt-8 font-medium">
                        By continuing, you agree to FixCity&apos;s <a className="hover:text-slate-300 underline transition-colors" href="#">Terms</a> and <a className="hover:text-slate-300 underline transition-colors" href="#">Privacy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
