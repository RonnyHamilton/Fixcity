'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    MapPin, Clock, CheckCircle, AlertTriangle,
    Navigation, Camera, ChevronRight, Calendar,
    Wrench, Upload, Phone, Globe, Shield, Activity, User
} from 'lucide-react';
import Link from 'next/link';
import { translations } from '@/lib/translations';

interface Task {
    id: string;
    user_name: string;
    user_phone?: string;
    category: string;
    description: string;
    image_url: string;
    address: string;
    latitude: number;
    longitude: number;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_technician_id: string;
    created_at: string;
}

export default function TechnicianDashboard() {
    const { user, language, setLanguage } = useAuthStore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const t = translations[language];

    const languages = [
        { code: 'en', label: 'English', native: 'English' },
        { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
        { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
        { code: 'te', label: 'Telugu', native: 'తెలుగు' }
    ] as const;

    const handleLanguageSelect = (code: 'en' | 'hi' | 'ta' | 'te') => {
        setLanguage(code);
        setIsLangMenuOpen(false);
    };

    useEffect(() => {
        if (user?.id) fetchTasks();
    }, [user?.id]);

    const fetchTasks = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch('/api/reports');
            if (response.ok) {
                const data = await response.json();
                // Filter tasks assigned to this technician OR in progress demo OR resolved
                const assignedTasks = (data.reports || []).filter(
                    (r: Task) => r.assigned_technician_id === user.id ||
                        r.status === 'in_progress' ||
                        r.status === 'resolved' // Show all resolved tasks so history is visible
                );
                setTasks(assignedTasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const todayTasks = tasks.length; // Simplified for total assigned
    const pendingTasks = tasks.filter(t => t.status !== 'resolved').length;
    const completedToday = tasks.filter(t => t.status === 'resolved').length;
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string; border: string }> = {
            urgent: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
            medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
            low: { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-100' },
        };
        return configs[priority] || configs.low;
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            pothole: 'edit_road',
            garbage: 'delete',
            'e-waste': 'devices',
            streetlight: 'lightbulb',
            graffiti: 'format_paint',
            water_leak: 'water_drop',
            sewage: 'plumbing',
        };
        return icons[category] || 'report';
    };

    // Filter tasks based on UI selection
    const filteredTasks = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
        if (filter === 'resolved') return t.status === 'resolved';
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT COLUMN - Profile & Quick Stats (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-[3px]">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center">
                                    <User className="w-10 h-10 text-slate-400" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800">{user?.name || 'Technician'}</h2>
                    <p className="text-sm text-slate-500 font-medium mb-6 uppercase tracking-wide">{user?.area || 'Field Unit'}</p>

                    <div className="grid grid-cols-2 gap-2 w-full pt-6 border-t border-slate-100">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-slate-800">{pendingTasks}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Pending</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-slate-100">
                            <span className="text-lg font-bold text-slate-800">{completedToday}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Done</span>
                        </div>
                    </div>
                </div>

                {/* System Status Mock */}
                <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[24px] p-6 shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-32 h-32" />
                    </div>
                    <p className="text-emerald-200 text-sm font-medium mb-1">Field Status</p>
                    <h3 className="text-2xl font-bold mb-4">Active</h3>
                    <div className="flex items-center gap-2 text-sm text-emerald-200">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        Syncing real-time
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - Main Content (9 Cols) */}
            <div className="lg:col-span-9 space-y-6">
                {/* Header Welcome */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t.goodMorning}, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-slate-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date().toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center gap-3 relative z-20">
                        <button
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all text-sm font-bold min-w-[140px] justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-emerald-500" />
                                <span>{languages.find(l => l.code === language)?.native}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isLangMenuOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isLangMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1">
                                    {languages.map((item) => (
                                        <button
                                            key={item.code}
                                            onClick={() => handleLanguageSelect(item.code)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${language === item.code
                                                ? 'bg-emerald-50 text-emerald-700 font-bold'
                                                : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border ${language === item.code ? 'bg-emerald-200 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    {item.code}
                                                </span>
                                                <div className="flex flex-col items-start leading-none gap-0.5">
                                                    <span>{item.native}</span>
                                                    <span className="text-[10px] opacity-50">{item.label}</span>
                                                </div>
                                            </div>
                                            {language === item.code && <CheckCircle className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button onClick={() => setFilter('all')} className="text-left bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[24px] p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group transition-transform hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm mb-4">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{todayTasks}</h3>
                            <p className="text-emerald-100 font-medium text-sm">{t.todayTasks}</p>
                        </div>
                    </button>

                    <button onClick={() => setFilter('resolved')} className="text-left bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[24px] p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group transition-transform hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm mb-4">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{completedToday}</h3>
                            <p className="text-blue-100 font-medium text-sm">{t.completed}</p>
                        </div>
                    </button>

                    <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-[24px] p-6 text-white shadow-lg shadow-red-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm mb-4">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{urgentTasks}</h3>
                            <p className="text-red-100 font-medium text-sm">{t.urgent}</p>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-emerald-500" />
                            {t.assignedTasks}
                        </h2>
                        <div className="flex gap-2">
                            {['all', 'pending', 'resolved'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredTasks.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">{t.allCaughtUp}</h3>
                            <p className="text-slate-400 text-sm">{t.noTasks}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTasks.map((task) => {
                                const priority = getPriorityConfig(task.priority);
                                return (
                                    <div
                                        key={task.id}
                                        className="bg-white rounded-[20px] p-4 border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col sm:flex-row gap-4"
                                    >
                                        {/* Image */}
                                        <div className="w-full h-40 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                                            {task.image_url ? (
                                                <img src={task.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-3xl text-slate-300">
                                                        {getCategoryIcon(task.category)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priority.color} ${priority.bg}`}>
                                                    {task.priority}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-emerald-600 bg-emerald-50">
                                                    {task.category.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-auto">{formatTimeAgo(task.created_at)}</span>
                                            </div>

                                            <p className="text-slate-500 text-sm flex items-center gap-1.5 mb-2 truncate">
                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                                                <span className="truncate">{task.address}</span>
                                            </p>

                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                                <span>{t.reportedBy}: <span className="text-slate-600 font-medium">{task.user_name}</span></span>
                                                {task.user_phone && (
                                                    <a href={`tel:${task.user_phone}`} className="flex items-center gap-1 text-emerald-600 font-bold hover:underline">
                                                        <Phone className="w-3 h-3" />
                                                        {task.user_phone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-row sm:flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 sm:flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"
                                                title={t.directions}
                                            >
                                                <Navigation className="w-4 h-4" />
                                            </a>
                                            <Link
                                                href={`/technician/tasks/${task.id}`}
                                                className="flex-1 sm:flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                                title={t.resolve}
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
