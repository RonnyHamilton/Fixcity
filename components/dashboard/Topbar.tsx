'use client';

import { useState } from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';
import clsx from 'clsx';

interface TopbarProps {
    setSidebarOpen: (open: boolean) => void;
}

export default function Topbar({ setSidebarOpen }: TopbarProps) {
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock notifications state
    const [notifications, setNotifications] = useState([
        { id: '1', title: 'Urgent Issue Reported', message: 'High priority pothole reported in Indiranagar', time: '2 mins ago', type: 'alert', read: false },
        { id: '2', title: 'Technician Update', message: 'Rajesh Kumar marked Report #RPT456 as In Progress', time: '1 hour ago', type: 'info', read: false },
        { id: '3', title: 'Duplicate Detected', message: 'New report merged into existing issue #RPT789', time: '2 hours ago', type: 'info', read: true }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <header className="sticky top-0 z-40 bg-[#f6f7fb]/80 backdrop-blur-md px-4 sm:px-8 py-4 flex-none border-b border-transparent">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4 relative">
                    <div className="hidden md:flex items-center px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm w-72 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-slate-600 w-full placeholder:text-slate-400"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:shadow hover:text-blue-600 transition-all relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white translate-x-1" />
                        )}
                    </button>
                    
                    <button className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm hover:shadow transition-all group overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Officer&background=e0e7ff&color=4f46e5&rounded=true&bold=true" alt="User Profile" className="w-full h-full object-cover" />
                    </button>

                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-100 rounded-[16px] shadow-xl shadow-slate-200/50 z-50 overflow-hidden ring-1 ring-black/5 animate-scale-in origin-top-right">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                    {unreadCount > 0 && <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                                </div>
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Mark all read
                                </button>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                                        You're all caught up!
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className={clsx("p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer", !notif.read && "bg-blue-50/10")}>
                                            <div className="flex gap-3">
                                                <div className={clsx("mt-1.5 w-2 h-2 rounded-full shrink-0", notif.type === 'alert' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-blue-500 shadow-sm shadow-blue-500/50')} />
                                                <div>
                                                    <p className={clsx("text-sm text-slate-800 mb-0.5", !notif.read ? "font-bold" : "font-medium")}>{notif.title}</p>
                                                    <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">{notif.message}</p>
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
    );
}
