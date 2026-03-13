'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Shield, LogOut, X, Crown, FileText } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface AdminSidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) {
    const { logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = [
        { href: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/super-admin/reports', icon: FileText, label: 'Reports' },
        { href: '/super-admin/taluk-officers', icon: Shield, label: 'Taluk Officers' },
        { href: '/super-admin/ward-officers', icon: Users, label: 'Ward Officers' },
    ];

    return (
        <aside className={clsx(
            "fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out",
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
            <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-all"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
                        <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">FixCity</h2>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">Super Admin</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all group",
                                        isActive
                                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                            : "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                    )}
                                >
                                    <Icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-white" : "group-hover:text-amber-600")} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={clsx("font-medium", isActive ? "font-semibold" : "")}>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:text-red-600" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
