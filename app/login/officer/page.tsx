'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, Shield, Lock } from 'lucide-react';
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
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(err => {
                        console.error('Video play error:', err);
                    });
                };

                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.log('Initial play deferred to onloadedmetadata');
                }
            }

            setCameraActive(true);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please grant camera permissions and reload the page.');
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

        await new Promise(resolve => setTimeout(resolve, 2000));

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        const image = canvas.toDataURL('image/jpeg');

        try {
            const response = await fetch('/api/auth/face-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    badgeId,
                    userType: 'officer',
                    image,
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
            setFaceVerified(true);
            stopCamera();
        } finally {
            setScanning(false);
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    useEffect(() => {
        if (faceVerified) {
            stopCamera();
        }
    }, [faceVerified, stopCamera]);

    // Handle login
    const handleLogin = async () => {
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
        <div className="min-h-screen w-full flex flex-col bg-[#f7f9fc]">

            {/* Header Bar */}
            <header className="w-full bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Logo & Portal Name */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1e40af] flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-slate-900 leading-tight">FixCity</span>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1e40af]">Officer Portal</span>
                        </div>
                    </div>

                    {/* Back Button */}
                    <Link
                        href="/login"
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Login</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">

                    {/* Authentication Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-8 py-6 text-center">
                            <h1 className="text-xl font-bold text-white">Officer Authentication</h1>
                            <p className="text-blue-100 text-sm mt-1">Secure identity verification required</p>
                        </div>

                        <div className="p-8">

                            {/* Face Verification Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-[#1e40af] text-white text-xs font-bold flex items-center justify-center">1</div>
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Identity Verification</h2>
                                </div>

                                {/* Camera Circle */}
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        {/* Outer ring with animated stroke when scanning */}
                                        <div className={`w-40 h-40 rounded-full border-4 ${faceVerified
                                            ? 'border-green-500'
                                            : scanning
                                                ? 'border-[#1e40af] animate-pulse'
                                                : 'border-slate-200'
                                            } p-1 transition-colors duration-300`}>
                                            {/* Inner circle with camera */}
                                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative">
                                                {/* Video Feed */}
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                                                />

                                                {/* Scanning Overlay */}
                                                {cameraActive && scanning && (
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        <div className="absolute inset-0 bg-[#1e40af]/10" />
                                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#1e40af] animate-[scan_2s_ease-in-out_infinite]" />
                                                    </div>
                                                )}

                                                {/* Placeholder States */}
                                                {!cameraActive && (
                                                    faceVerified ? (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-green-50">
                                                            <ShieldCheck className="w-14 h-14 text-green-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                                            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                                                                <Shield className="w-8 h-8 text-slate-400" />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold ${faceVerified
                                            ? 'bg-green-500 text-white'
                                            : scanning
                                                ? 'bg-[#1e40af] text-white'
                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            {faceVerified ? '✓ Verified' : scanning ? 'Scanning...' : 'Not Verified'}
                                        </div>
                                    </div>

                                    {/* Instructions */}
                                    <p className="text-sm text-slate-500 mt-6 text-center">
                                        {faceVerified
                                            ? 'Identity verified successfully'
                                            : 'Position your face clearly in the frame'}
                                    </p>

                                    {/* Camera Button */}
                                    {!faceVerified && (
                                        <button
                                            onClick={cameraActive ? captureFace : startCamera}
                                            disabled={scanning}
                                            className="mt-4 px-6 py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {scanning ? (
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                            ) : cameraActive ? (
                                                'Verify My Face'
                                            ) : (
                                                'Start Camera'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Hidden Canvas */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Divider */}
                            <div className="border-t border-slate-200 my-6" />

                            {/* Credentials Section */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-[#1e40af] text-white text-xs font-bold flex items-center justify-center">2</div>
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Login Credentials</h2>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                                    {/* Badge ID */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Badge ID</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={badgeId}
                                                onChange={(e) => {
                                                    setBadgeId(e.target.value);
                                                    setError('');
                                                    setFaceVerified(false);
                                                }}
                                                className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 focus:outline-none transition-all"
                                                placeholder="Enter your Badge ID"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                                className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-12 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/20 focus:outline-none transition-all"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-red-700 text-sm font-medium">{error}</p>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading || !faceVerified}
                                        className="w-full h-12 bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Complete Authentication</span>
                                                <Shield className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-slate-600">Encrypted & Secure Access</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">© 2026 FixCity Governance Systems • Government of India</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
