'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isAuthenticated, role } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isTalukOfficer, setIsTalukOfficer] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        import('@/lib/supabase').then(({ supabase }) => {
            supabase
                .from('ward_officers')
                .select('ward_id', { count: 'exact' })
                .eq('officer_id', user.id)
                .then(({ count }) => {
                    setIsTalukOfficer((count ?? 0) > 1);
                });
        });
    }, [user?.id]);

    useEffect(() => {
        if (!isAuthenticated || role !== 'officer') {
            router.push('/login/officer');
        }
    }, [isAuthenticated, role, router]);

    if (!isAuthenticated || role !== 'officer') {
        return (
            <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7fb] flex font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isTalukOfficer={isTalukOfficer} />

            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
                <Topbar setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
