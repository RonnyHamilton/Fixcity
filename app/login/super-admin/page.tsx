'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, Shield, Lock, Crown } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function SuperAdminLoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();

    const [badgeId, setBadgeId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!badgeId.trim()) {
            setError('Please enter your Admin Badge ID');
            return;
        }
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/super-admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ badgeId, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            login({
                id: data.id,
                name: data.name,
                role: 'super_admin',
                badgeId: data.badgeId,
                area: data.area,
            });

            router.push('/super-admin/dashboard');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col bg-slate-50">

            {/* Header Bar */}
            <header className="w-full bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-slate-900 leading-tight">FixCity</span>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Super Admin</span>
                        </div>
                    </div>
                    <Link
                        href="/login"
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
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
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-8 py-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTIwIDBMMzAgMTBMMjAgMjBMMTAgMTB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                            <div className="relative">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                                    <Crown className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-white">Super Admin Portal</h1>
                                <p className="text-amber-100 text-sm mt-1">Elevated access for system administration</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">

                                {/* Badge ID */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Admin Badge ID</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={badgeId}
                                            onChange={(e) => { setBadgeId(e.target.value); setError(''); }}
                                            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                                            placeholder="Enter your Admin Badge ID"
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
                                            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
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
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                        <p className="text-red-600 text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span>Sign In as Super Admin</span>
                                            <Crown className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium text-slate-600">Restricted Access • Audit Logged</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-3">© 2026 FixCity Governance Systems • Government of India</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
