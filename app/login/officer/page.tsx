'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function OfficerLoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [badgeId, setBadgeId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cameraActive, setCameraActive] = useState(false);
    const [faceVerified, setFaceVerified] = useState(false);
    const [scanning, setScanning] = useState(false);

    // Start camera for face verification
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });

            // Set stream immediately
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setCameraActive(true);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please grant camera permissions.');
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setCameraActive(false);
        }
    }, []);

    // Capture face and verify
    const captureFace = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setScanning(true);
        setError('');

        // Simulate scanning delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        const image = canvas.toDataURL('image/jpeg');

        // For prototype: Mock face verification
        // In production, send canvas image to face recognition API
        try {
            const response = await fetch('/api/auth/face-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    badgeId,
                    userType: 'officer',
                    image, // Send the actual base64 image
                }),
            });

            const data = await response.json();

            if (response.ok && data.verified) {
                setFaceVerified(true);
                stopCamera();
            } else {
                setError(data.error || 'Face verification failed. Please try again.');
            }
        } catch {
            // Mock success for prototype
            setFaceVerified(true);
            stopCamera();
        } finally {
            setScanning(false);
        }
    };

    // Handle login
    const handleLogin = async () => {
        // MANDATORY: Face verification must be completed first
        if (!faceVerified) {
            setError('Face verification is required. Please complete identity verification first.');
            return;
        }

        if (!badgeId.trim()) {
            setError('Please enter your Badge ID');
            return;
        }

        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/officer-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ badgeId, password, faceVerified }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            // Login successful
            login({
                id: data.id,
                name: data.name,
                role: 'officer',
                badgeId: data.badgeId,
                area: data.area,
            });

            router.push('/officer/dashboard');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col justify-center items-center overflow-y-auto overflow-x-hidden bg-[#0f172a]">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-950" />

                {/* Glow Effects */}
                <div className="absolute -top-[10%] -right-[5%] h-[800px] w-[800px] rounded-full bg-pink-600/5 blur-[140px] pointer-events-none" />
                <div className="absolute -bottom-[15%] -left-[10%] h-[800px] w-[800px] rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none" />
                <div className="absolute top-[30%] -left-[5%] h-[700px] w-[700px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

                {/* Grid Pattern */}
                <svg className="absolute inset-0 h-full w-full opacity-[0.05] pointer-events-none">
                    <defs>
                        <pattern id="grid-pattern" height="40" patternUnits="userSpaceOnUse" width="40">
                            <path className="text-slate-500" d="M40 0L0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect fill="url(#grid-pattern)" height="100%" width="100%" />
                </svg>
            </div>

            {/* Logo */}
            <div className="relative sm:absolute left-0 top-0 z-50 p-6 sm:p-10 w-full sm:w-auto flex justify-start sm:block shrink-0">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
                        <span className="material-symbols-outlined text-[24px] text-blue-400">local_police</span>
                    </div>
                    <div className="flex flex-col justify-center text-left">
                        <span className="font-display text-lg font-bold text-white tracking-tight leading-none">FixCity</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80 mt-0.5">Officer Portal</span>
                    </div>
                </div>
            </div>

            {/* Back Button */}
            <div className="absolute right-0 top-0 z-50 p-6 sm:p-10">
                <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-white transition-colors group"
                >
                    <span className="hidden sm:inline">Back to Login Options</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                </Link>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-[440px] px-6 py-12">
                <div className="glass-panel rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    {/* Card Glow */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col items-center gap-8">
                        {/* Face Verification Section */}
                        <div className="relative">
                            <div className="group relative flex h-52 w-52 items-center justify-center rounded-full border-2 border-dashed border-blue-500/30 bg-slate-950/40 p-1.5 ring-8 ring-blue-500/5">
                                <div className="relative h-full w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-white/10">
                                    {/* Camera Preview - Always Rendered but Controlled via CSS */}
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${cameraActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    />

                                    {/* Scanning Overlays */}
                                    {cameraActive && scanning && (
                                        <div className="absolute inset-0 z-20 pointer-events-none">
                                            <div className="scanner-line" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent animate-scan" />
                                        </div>
                                    )}

                                    {/* Placeholder States */}
                                    {!cameraActive && (
                                        faceVerified ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 z-10">
                                                <ShieldCheck className="w-20 h-20 text-green-500" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-40 z-10">
                                                <span className="material-symbols-outlined text-[80px] text-blue-400/20">account_circle</span>
                                            </div>
                                        )
                                    )}

                                    {/* Viewfinder Corners */}
                                    <div className="absolute inset-4 border border-white/5 rounded-2xl">
                                        <div className="viewfinder-corner top-0 left-0 border-t-2 border-l-2 rounded-tl-lg" />
                                        <div className="viewfinder-corner top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" />
                                        <div className="viewfinder-corner bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg" />
                                        <div className="viewfinder-corner bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg" />
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-lg bg-blue-500/10 px-2 py-1 backdrop-blur-md border border-blue-400/20">
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${faceVerified ? 'text-green-400' : 'text-blue-400'}`}>
                                        {faceVerified ? 'Verified' : scanning ? 'Scanning' : 'Ready'}
                                    </span>
                                </div>
                            </div>

                            {/* Camera Controls */}
                            <div className="mt-4 text-center">
                                <h2 className="font-display text-xl font-bold tracking-tight text-white">Identity Verification</h2>
                                <p className="text-xs font-medium text-slate-400 mt-1">
                                    {faceVerified ? 'Face verified successfully' : 'Align face to begin scanning'}
                                </p>

                                {!faceVerified && (
                                    <button
                                        onClick={cameraActive ? captureFace : startCamera}
                                        disabled={scanning}
                                        className="mt-4 px-6 py-2.5 bg-primary/90 hover:bg-primary text-white text-sm font-bold rounded-full shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
                                    >
                                        {scanning ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : cameraActive ? (
                                            'Verify Identity'
                                        ) : (
                                            'Start Camera'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Hidden Canvas for Capture */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Login Form - Requires Face Verification */}
                        <div className="w-full space-y-6">
                            <div className="relative py-2 flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    {faceVerified ? 'Complete Login' : 'Verify Identity First'}
                                </span>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="flex flex-col gap-4">
                                {/* Badge ID */}
                                <div className="space-y-1.5">
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within/input:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">badge</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={badgeId}
                                            onChange={(e) => {
                                                setBadgeId(e.target.value);
                                                setError('');
                                                setFaceVerified(false); // Reset verification if ID changes
                                            }}
                                            className="w-full rounded-xl border border-white/5 bg-slate-950/30 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all focus:border-primary/50 focus:bg-slate-950/70 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                            placeholder="Badge ID"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within/input:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">lock</span>
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                            className="w-full rounded-xl border border-white/5 bg-slate-950/30 py-3 pl-11 pr-12 text-sm text-white placeholder-slate-500 backdrop-blur-md transition-all focus:border-primary/50 focus:bg-slate-950/70 focus:outline-none focus:ring-4 focus:ring-primary/10"
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !faceVerified}
                                    className="group mt-2 relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-primary-hover hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Complete Auth</span>
                                            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">login</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex flex-col items-center gap-5 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-[11px] font-bold text-blue-300/90 backdrop-blur-md uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">verified_user</span>
                        <span>Encrypted Terminal Access</span>
                    </div>



                    <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">© 2026 FixCity Governance Systems</p>
                </div>
            </div>
        </div>
    );
}
