'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Fingerprint, Smartphone, Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function PublicLoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();

    const [step, setStep] = useState<'aadhaar' | 'otp'>('otp'); // Keep as 'otp' to ensure OTP section is visible if using the animated transition, or just remove the conditional logic
    const [aadhaar, setAadhaar] = useState('');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    const otpRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Format Aadhaar number
    const formatAadhaar = (value: string) => {
        const numbers = value.replace(/\D/g, '').slice(0, 12);
        const parts = [];
        for (let i = 0; i < numbers.length; i += 4) {
            parts.push(numbers.slice(i, i + 4));
        }
        return parts.join(' ');
    };

    // Handle Aadhaar input
    const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAadhaar(formatAadhaar(e.target.value));
        setError('');
    };

    // Handle mobile input
    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setMobile(value);
        setError('');
    };

    // Send OTP
    const handleSendOTP = async () => {
        const cleanAadhaar = aadhaar.replace(/\s/g, '');

        if (cleanAadhaar.length !== 12) {
            setError('Please enter a valid 12-digit Aadhaar number');
            return;
        }

        if (mobile.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        // Check if user has already entered the master OTP
        const enteredOtp = otp.join('');
        const masterOTP = '123456'; // Hardcoded master OTP

        if (enteredOtp === masterOTP) {
            // Master OTP detected - skip SMS sending and go straight to verification
            console.log('Master OTP detected - bypassing SMS');
            setStep('otp');
            setCountdown(300);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar: cleanAadhaar, mobile, channel: 'whatsapp' }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to send OTP');
                return;
            }

            // Proceed to OTP step (user can enter master OTP)
            setStep('otp');
            setCountdown(300); // 5 minutes
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP input
    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs[index + 1].current?.focus();
        }
    };

    // Handle OTP backspace
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        const otpValue = otp.join('');

        if (otpValue.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aadhaar: aadhaar.replace(/\s/g, ''),
                    mobile,
                    otp: otpValue
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid OTP');
                return;
            }

            // Login successful
            login({
                id: data.userId || `USR_${Date.now()}`,
                name: data.name || 'Citizen',
                role: 'public',
                aadhaar: aadhaar.replace(/\s/g, ''),
                phone: mobile,
            });

            router.push('/public/dashboard');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = () => {
        if (countdown > 0) return;
        setOtp(['', '', '', '', '', '']);
        handleSendOTP();
    };

    return (
        <div className="relative min-h-screen w-full flex bg-[#0a0f16] selection:bg-primary/30 selection:text-white">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-1/2 min-h-screen relative overflow-hidden items-center justify-center p-12 lg:p-20 bg-[#0a0f16] border-r border-white/5">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920')`,
                        filter: 'grayscale(0.4) contrast(1.2)'
                    }}
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f16]/90 to-transparent" />

                {/* Glow Effects */}
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
                {/* Background Effects */}
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-500/05 rounded-full blur-[140px] pointer-events-none" />

                {/* Mobile Header */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center lg:hidden z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-2xl">public</span>
                        </div>
                        <h2 className="text-white text-xl font-bold tracking-tight">FixCity</h2>
                    </div>
                </div>

                {/* Back Button */}
                <div className="absolute top-0 right-0 w-full p-8 flex justify-end items-center hidden lg:flex z-20">
                    <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Portal Selection
                    </Link>
                </div>

                {/* Login Card */}
                <div className="w-full max-w-[440px] relative z-10">
                    <div className="glass-panel rounded-[2rem] p-8 sm:p-12 flex flex-col gap-8 relative overflow-hidden backdrop-blur-2xl border-white/5">

                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Citizen Login</h1>
                            <p className="text-slate-400 text-sm">
                                Enter your details to access the dashboard.
                            </p>
                        </div>

                        {/* Form */}
                        <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                            {/* Aadhaar Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider" htmlFor="aadhaar">Aadhaar Number</label>
                                <div className="group relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                        <Fingerprint className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="aadhaar"
                                        type="text"
                                        value={aadhaar}
                                        onChange={handleAadhaarChange}
                                        className="w-full h-12 rounded-xl glass-input pl-12 pr-4 text-base tracking-wide font-medium bg-white/5 focus:bg-white/10"
                                        placeholder="XXXX XXXX XXXX"
                                        maxLength={14}
                                    />
                                </div>
                            </div>

                            {/* Mobile Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider" htmlFor="mobile">Mobile Number</label>
                                <div className="group relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="mobile"
                                        type="tel"
                                        value={mobile}
                                        onChange={handleMobileChange}
                                        className="w-full h-12 rounded-xl glass-input pl-12 pr-28 text-base tracking-wide font-medium bg-white/5 focus:bg-white/10"
                                        placeholder="98765 43210"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={loading || mobile.length !== 10}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send OTP'}
                                    </button>
                                </div>
                            </div>

                            {/* OTP Section */}
                            <div className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ${step === 'otp' ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="flex justify-between items-end px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Code</label>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                        Check your Mobile for the code
                                    </span>
                                </div>

                                <div className="flex gap-2 justify-between">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={otpRefs[index]}
                                            type="text"
                                            inputMode="numeric"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-full h-12 aspect-square rounded-xl glass-input text-center text-lg font-bold focus:-translate-y-1 transition-all bg-white/5 focus:bg-white/10 border-white/10"
                                            maxLength={1}
                                        />
                                    ))}
                                </div>

                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                                        {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={countdown > 0}
                                        className="text-xs font-bold text-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:text-primary"
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleVerifyOTP}
                                disabled={loading}
                                className="mt-2 w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Authorize & Login
                                        <Shield className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-slate-500/60 text-xs mt-8 font-medium">
                        By logging in, you agree to FixCity&apos;s <a className="hover:text-slate-300 underline transition-colors" href="#">Terms</a> and <a className="hover:text-slate-300 underline transition-colors" href="#">Privacy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
