'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { LayoutDashboard, FileText, LogOut, Bell, User, X, Check } from 'lucide-react';
import { translations } from '@/lib/translations';
import { motion, AnimatePresence } from 'framer-motion';

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, role, logout, language } = useAuthStore();
    const { notifications, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const t = translations[language];

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close notifications when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add mock notifications for demo if empty
    useEffect(() => {
        if (notifications.length === 0) {
            addNotification({
                title: 'Welcome to FixCity',
                message: 'Your technician dashboard is ready.',
                type: 'success'
            });
            addNotification({
                title: 'New Task Available',
                message: 'A new road repair task has been assigned to your area.',
                type: 'info'
            });
        }
    }, [notifications.length, addNotification]);

    useEffect(() => {
        if (!isAuthenticated || role !== 'technician') {
            router.push('/login/technician');
        }
    }, [isAuthenticated, role, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!isAuthenticated || role !== 'technician') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const navItems = [
        { href: '/technician/dashboard', icon: LayoutDashboard, label: t.dashboard },
        { href: '/technician/tasks', icon: FileText, label: t.allTasks },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] right-[-15%] w-[60rem] h-[60rem] rounded-full bg-emerald-100/40 blur-[100px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-blue-100/40 blur-[100px]" />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 text-emerald-600 flex items-center justify-center bg-emerald-50 rounded-lg border border-emerald-100">
                            <span className="material-symbols-outlined text-xl">engineering</span>
                        </div>
                        <span className="font-bold text-slate-900">FixCity</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-slate-100 mb-3 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.specialization}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm font-medium border border-transparent hover:border-red-100"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-4">
                <div className="mx-auto max-w-[1400px] flex items-center justify-between">
                    {/* Left Section: Mobile Menu + Logo */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 text-emerald-600 flex items-center justify-center bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                                <span className="material-symbols-outlined text-2xl">engineering</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">FixCity</h2>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider hidden sm:block">{t.fieldTechnician}</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 rounded-full px-2 py-1 border border-slate-200">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium leading-normal transition-all ${isActive
                                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm relative group"
                            >
                                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 ring-1 ring-black/5"
                                    >
                                        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                            <h3 className="font-bold text-slate-800">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => markAllAsRead()}
                                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400">
                                                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                                    <p className="text-sm">No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${!notification.read ? 'bg-emerald-50/30' : ''
                                                            }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-emerald-500' : 'bg-transparent'
                                                                }`} />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={`text-sm font-bold mb-1 ${!notification.read ? 'text-slate-900' : 'text-slate-600'
                                                                    }`}>
                                                                    {notification.title}
                                                                </h4>
                                                                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                                                                    {notification.message}
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                                        {new Date(notification.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                    {!notification.read && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                markAsRead(notification.id);
                                                                            }}
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 px-2 py-1 rounded-full flex items-center gap-1 font-bold"
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                            Mark read
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Desktop User Menu */}
                        <div className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                <p className="text-xs text-slate-500">{user?.specialization}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 sm:px-6 py-8 mx-auto w-full max-w-[1400px] overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
