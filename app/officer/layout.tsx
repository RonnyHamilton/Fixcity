'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { LayoutDashboard, FileText, Users, BarChart3, LogOut, Bell, Search, Settings, User, MessageCircle, Menu, X } from 'lucide-react';

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isAuthenticated, role, logout } = useAuthStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
        <div className="min-h-screen bg-[#F7F8FA] flex font-sans text-slate-800">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                {/* Close Button (Mobile Only) */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Logo */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 text-blue-600 flex items-center justify-center bg-blue-50 rounded-xl">
                            <span className="material-symbols-outlined text-2xl">shield</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">FixCity</h2>
                            <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Officer Portal</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            // Basic check for active state could be added here if we had pathname
                            // avoiding usePathname for clean simpler migration unless needed
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                                    >
                                        <Icon className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-[#F7F8FA]/90 backdrop-blur-md px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Hamburger Menu Button (Mobile Only) */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 relative">
                            {/* Search (Visual Only) */}
                            <div className="hidden md:flex items-center px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm w-64">
                                <Search className="w-4 h-4 text-slate-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent border-none outline-none text-sm text-slate-600 w-full placeholder:text-slate-400"
                                />
                            </div>

                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:shadow transition-all relative"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                )
                                }
                            </button>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
                                <User className="w-5 h-5" />
                            </div>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden ring-1 ring-black/5">
                                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                            {unreadCount > 0 && <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                                        </div>
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-xs">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                        <div>
                                                            <p className={`text-sm text-slate-800 mb-0.5 ${!notif.read ? 'font-semibold' : ''}`}>{notif.title}</p>
                                                            <p className="text-xs text-slate-500 mb-1 leading-relaxed">{notif.message}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{notif.time}</p>
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
                <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
