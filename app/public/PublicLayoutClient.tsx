'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Home, FileText, HelpCircle, AlertCircle, LogOut, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface PublicUser {
    id: string;
    name: string;
    email: string;
}

function PublicLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<PublicUser | null>(null);

    // Auth check - uses UID from URL, not auth store
    useEffect(() => {
        const uid = searchParams.get('uid');

        // No UID in URL → redirect to login
        if (!uid) {
            window.location.href = '/login/public';
            return;
        }

        // Fetch user from database
        const fetchUser = async () => {
            const { data, error } = await supabase
                .from('public_users')
                .select('id, name, email')
                .eq('id', uid)
                .single();

            if (error || !data) {
                window.location.href = '/login/public';
                return;
            }

            setUser(data);
            setMounted(true);
        };

        fetchUser();
    }, [searchParams]);

    const handleLogout = () => {
        window.location.href = '/';
    };

    const handleSearch = (term: string) => {
        const uid = searchParams.get('uid');
        const params = new URLSearchParams();
        if (uid) params.set('uid', uid);
        if (term) params.set('q', term);

        if (pathname === '/public/help') {
            router.push(`/public/dashboard?${params.toString()}`);
        } else {
            router.replace(`${pathname}?${params.toString()}`);
        }
    };

    if (!mounted || !user) {
        return (
            <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Build URLs with uid preserved
    const uid = searchParams.get('uid');
    const navItems = [
        { path: `/public/dashboard?uid=${uid}`, label: 'Dashboard', icon: Home },
        { path: `/public/my-reports?uid=${uid}`, label: 'My Reports', icon: FileText },
        { path: `/public/help?uid=${uid}`, label: 'Help', icon: HelpCircle },
    ];

    return (
        <div className="min-h-screen bg-[#0a0f16] flex flex-col selection:bg-primary/30 selection:text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-25%] left-[-20%] w-[80rem] h-[80rem] rounded-full bg-primary/05 blur-[140px] mix-blend-screen opacity-60" />
                <div className="absolute bottom-[-25%] right-[-20%] w-[80rem] h-[80rem] rounded-full bg-purple-500/05 blur-[140px] mix-blend-screen opacity-60" />
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '100px 100px'
                    }}
                />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0f16]/70 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3">
                <div className="mx-auto max-w-7xl flex items-center justify-between gap-6 md:gap-12">
                    <div className="flex items-center gap-4 xl:gap-8">
                        {/* Logo */}
                        <Link href={`/public/dashboard?uid=${uid}`} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 text-primary flex items-center justify-center bg-primary/10 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                            </div>
                            <span className="text-xl font-black tracking-tight text-white hidden sm:block">
                                Fix<span className="text-primary">City</span>
                            </span>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1.5 backdrop-blur-md border border-white/5">
                            {navItems.map((item) => {
                                const isActive = pathname === item.path.split('?')[0];
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-highlight"
                                                className="absolute inset-0 bg-white/10 shadow-sm border border-white/5 rounded-full"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="hidden xl:flex items-center bg-white/5 backdrop-blur-sm border border-white/5 rounded-full h-10 px-4 w-64 focus-within:ring-2 focus-within:ring-primary/50 transition-all focus-within:bg-white/10 group">
                            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                            <input
                                className="bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0 w-full ml-3 font-medium"
                                placeholder="Search reports..."
                                onChange={(e) => handleSearch(e.target.value)}
                                defaultValue={searchParams.get('q')?.toString()}
                            />
                        </div>

                        {/* Report Button */}
                        <Link
                            href={`/public/report?uid=${uid}`}
                            className="bg-primary hover:bg-primary-hover text-white h-10 px-5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 border border-white/10"
                        >
                            <AlertCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Report Issue</span>
                        </Link>

                        {/* Profile Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="hidden sm:block text-sm font-semibold text-white whitespace-nowrap">{user?.name || 'User'}</span>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 mt-4 w-56 py-2 bg-[#0a0f16]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 z-50">
                                <div className="px-5 py-3 border-b border-white/5">
                                    <p className="text-sm font-bold text-white whitespace-nowrap">{user?.name || 'User'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 font-mono opacity-80">{user?.email}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
                {children}
            </main>
        </div>
    );
}

export default function PublicLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <PublicLayoutContent>
                {children}
            </PublicLayoutContent>
        </Suspense>
    );
}
