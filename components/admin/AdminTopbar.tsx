'use client';

import { Menu, Crown } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface AdminTopbarProps {
    setSidebarOpen: (open: boolean) => void;
}

export default function AdminTopbar({ setSidebarOpen }: AdminTopbarProps) {
    const { user } = useAuthStore();

    return (
        <header className="sticky top-0 z-30 bg-[#f6f7fb]/80 backdrop-blur-md border-b border-transparent px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:shadow transition-all"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 ml-auto">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-amber-600">Super Admin</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/10">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
}
