'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, signOut } from '@/lib/supabase';
import { Home, FileText, HelpCircle, AlertCircle, LogOut, Search, User, Zap, ChevronDown } from 'lucide-react';
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
    const [dropdownOpen, setDropdownOpen] = useState(false);

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

    const handleLogout = async () => {
        await signOut();
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">

            {/* Decorative Background - with solid white base to prevent dark bleed */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                {/* Solid white base */}
                <div className="absolute inset-0 bg-white" />
                {/* Light gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30" />
                {/* Decorative blurs */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-6 py-3">
                <div className="mx-auto max-w-7xl flex items-center justify-between gap-6 md:gap-12">
                    <div className="flex items-center gap-4 xl:gap-8">
                        {/* Logo */}
                        <Link href={`/public/dashboard?uid=${uid}`} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                                <Zap className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-slate-800 hidden sm:block">
                                Fix<span className="text-blue-600">City</span>
                            </span>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 rounded-full p-1.5">
                            {navItems.map((item) => {
                                const isActive = pathname === item.path.split('?')[0];
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-highlight"
                                                className="absolute inset-0 bg-white shadow-sm border border-slate-200/50 rounded-full"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="hidden xl:flex items-center bg-slate-100 rounded-full h-10 px-4 w-64 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all focus-within:bg-white focus-within:border-blue-200 border border-transparent group">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                className="bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:ring-0 w-full ml-3 font-medium outline-none"
                                placeholder="Search reports..."
                                onChange={(e) => handleSearch(e.target.value)}
                                defaultValue={searchParams.get('q')?.toString()}
                            />
                        </div>

                        {/* Report Button */}
                        <Link
                            href={`/public/report?uid=${uid}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95"
                        >
                            <AlertCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Report Issue</span>
                        </Link>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="hidden sm:block text-sm font-semibold text-slate-700 whitespace-nowrap">{user?.name || 'User'}</span>
                                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                            </button>

                            {/* Dropdown */}
                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 py-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50">
                                        <div className="px-5 py-3 border-b border-slate-100">
                                            <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{user?.name || 'User'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation */}
            <div className="md:hidden sticky top-[61px] z-40 bg-white/90 backdrop-blur-lg border-b border-slate-100 px-4 py-2">
                <nav className="flex items-center gap-1 overflow-x-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path.split('?')[0];
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${isActive
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        }>
            <PublicLayoutContent>
                {children}
            </PublicLayoutContent>
        </Suspense>
    );
}
