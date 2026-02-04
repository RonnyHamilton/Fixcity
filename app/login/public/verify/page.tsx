'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Check if we have a session (user clicked the magic link)
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    setStatus('error');
                    setErrorMessage(error.message || 'Failed to verify your email');
                    return;
                }

                if (session && session.user) {
                    // Session exists - email is verified!
                    console.log('Email verified, user logged in:', session.user.id);

                    // Retrieve pending name from localStorage
                    const pendingName = localStorage.getItem('fixcity_pending_name');

                    if (pendingName) {
                        // Store the name permanently
                        localStorage.setItem('fixcity_public_name', pendingName);
                        // Clear the pending name
                        localStorage.removeItem('fixcity_pending_name');
                    } else {
                        // Fallback: use email as name if no pending name
                        localStorage.setItem('fixcity_public_name', session.user.email || 'Citizen');
                    }

                    setStatus('success');

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        router.push('/public/dashboard');
                    }, 2000);
                } else {
                    // No session yet - might be loading or link expired
                    // Wait a bit longer
                    setTimeout(() => {
                        setStatus('error');
                        setErrorMessage('Verification link may have expired or is invalid');
                    }, 5000);
                }
            } catch (err: any) {
                console.error('Verification error:', err);
                setStatus('error');
                setErrorMessage('An unexpected error occurred');
            }
        };

        verifyEmail();
    }, [router]);

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f16] selection:bg-primary/30 selection:text-white px-4">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-500/05 rounded-full blur-[140px] pointer-events-none" />

            {/* Verification Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="glass-panel rounded-[2rem] p-8 sm:p-12 flex flex-col gap-8 relative overflow-hidden backdrop-blur-2xl border-white/5">

                    {/* Verifying State */}
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 animate-pulse">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                                    Verifying Your Email
                                </h1>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Please wait while we confirm your email address...
                                </p>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary animate-pulse w-2/3" />
                            </div>
                        </div>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 animate-bounce-slow">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                                    Email Verified!
                                </h1>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Your email has been successfully verified.
                                </p>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 w-full">
                                <p className="text-sm text-green-300 font-medium flex items-center gap-2 justify-center">
                                    <CheckCircle className="w-5 h-5 shrink-0" />
                                    Redirecting to your dashboard...
                                </p>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 animate-[progress_2s_ease-in-out_forwards] w-full origin-left" />
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
                                    Verification Failed
                                </h1>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {errorMessage || 'We couldn\'t verify your email address.'}
                                </p>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full">
                                <p className="text-sm text-red-300 font-medium">
                                    The verification link may have expired or is invalid.
                                </p>
                            </div>
                            <div className="space-y-3 w-full">
                                <Link
                                    href="/login/public"
                                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                                >
                                    <Mail className="w-5 h-5" />
                                    Try Again
                                </Link>
                                <Link
                                    href="/public/report"
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl font-bold transition-all block text-center"
                                >
                                    Continue as Guest
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-500/60 text-xs mt-8 font-medium">
                    Need help? Contact <a className="hover:text-slate-300 underline transition-colors" href="#">support@fixcity.com</a>
                </p>
            </div>

            <style jsx>{`
                @keyframes progress {
                    from {
                        transform: scaleX(0);
                    }
                    to {
                        transform: scaleX(1);
                    }
                }
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
