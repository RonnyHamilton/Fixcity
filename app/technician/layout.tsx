'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { LayoutDashboard, FileText, CheckSquare, LogOut, Bell, User, X, Check, MessageCircle } from 'lucide-react';
import { translations } from '@/lib/translations';
import { motion, AnimatePresence } from 'framer-motion';

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, role, logout, language } = useAuthStore();
    const { notifications, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
    const [showNotifications, setShowNotifications] = useState(false);
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
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const navItems = [
        { href: '/technician/dashboard', icon: LayoutDashboard, label: t.dashboard },
        { href: '/technician/tasks', icon: FileText, label: t.allTasks },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] right-[-15%] w-[60rem] h-[60rem] rounded-full bg-emerald-900/15 blur-[140px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-yellow-900/10 blur-[140px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="mx-auto max-w-[1400px] flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 text-emerald-400 flex items-center justify-center bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <span className="material-symbols-outlined text-2xl">engineering</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">FixCity</h2>
                            <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">{t.fieldTechnician}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 backdrop-blur-md border border-white/5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium leading-normal transition-all ${isActive
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all relative"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 ring-1 ring-black/5"
                                    >
                                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                            <h3 className="font-semibold text-white">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => markAllAsRead()}
                                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400">
                                                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                                    <p className="text-sm">No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative group ${!notification.read ? 'bg-emerald-500/5' : ''
                                                            }`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-emerald-500' : 'bg-transparent'
                                                                }`} />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={`text-sm font-medium mb-1 ${!notification.read ? 'text-emerald-50' : 'text-gray-300'
                                                                    }`}>
                                                                    {notification.title}
                                                                </h4>
                                                                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                                                                    {notification.message}
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] text-gray-500">
                                                                        {new Date(notification.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                    {!notification.read && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                markAsRead(notification.id);
                                                                            }}
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-full flex items-center gap-1"
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

                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-gray-400">{user?.specialization}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 py-6 mx-auto w-full max-w-[1400px]">
                {children}
            </main>
        </div>
    );
}
