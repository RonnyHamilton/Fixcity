'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { LayoutDashboard, FileText, Users, BarChart3, LogOut, Bell, Search, Settings, User, MessageCircle } from 'lucide-react';

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isAuthenticated, role, logout } = useAuthStore();
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock notifications state
    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'Urgent Issue Reported',
            message: 'High priority pothole reported in Indiranagar',
            time: '2 mins ago',
            type: 'alert',
            read: false
        },
        {
            id: '2',
            title: 'Technician Update',
            message: 'Rajesh Kumar marked Report #RPT456 as In Progress',
            time: '1 hour ago',
            type: 'info',
            read: false
        },
        {
            id: '3',
            title: 'Duplicate Detected',
            message: 'New report merged into existing issue #RPT789',
            time: '2 hours ago',
            type: 'info',
            read: true
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    useEffect(() => {
        if (!isAuthenticated || role !== 'officer') {
            router.push('/login/officer');
        }
    }, [isAuthenticated, role, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!isAuthenticated || role !== 'officer') {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const navItems = [
        { href: '/officer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/officer/reports', icon: FileText, label: 'All Reports' },
        { href: '/officer/technicians', icon: Users, label: 'Technicians' },
        { href: '/officer/analytics', icon: BarChart3, label: 'Analytics' },
    ];

    // Unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-[#0f172a] flex">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] right-[-15%] w-[60rem] h-[60rem] rounded-full bg-blue-900/15 blur-[140px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-purple-900/10 blur-[140px]" />
            </div>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-[#020617]/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-50">
                {/* Logo */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 text-blue-400 flex items-center justify-center bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <span className="material-symbols-outlined text-2xl">shield</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">FixCity</h2>
                            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">Officer Portal</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400">{user?.area}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">

                        </div>

                        <div className="flex items-center gap-4 relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all relative"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-2 w-96 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                            {unreadCount > 0 && <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                                        </div>
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Mark all as read
                                        </button>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div key={notif.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-white/[0.02]' : ''}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                        <div>
                                                            <p className={`text-sm text-white mb-1 ${!notif.read ? 'font-semibold' : ''}`}>{notif.title}</p>
                                                            <p className="text-xs text-gray-400 mb-2">{notif.message}</p>
                                                            <p className="text-[10px] text-gray-500">{notif.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}


                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
