'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    MapPin, Clock, CheckCircle, AlertTriangle,
    Navigation, Camera, ChevronRight, Calendar,
    Wrench, Upload, Phone, Globe
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
    const todayTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedToday = tasks.filter(t => t.status === 'resolved').length;
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string; border: string }> = {
            urgent: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
            high: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
            medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
            low: { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t.goodMorning}, {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all text-sm font-medium min-w-[120px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" />
                            <span>{languages.find(l => l.code === language)?.native}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isLangMenuOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isLangMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-1">
                                {languages.map((item) => (
                                    <button
                                        key={item.code}
                                        onClick={() => handleLanguageSelect(item.code)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${language === item.code
                                            ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border border-white/5">
                                                {item.code}
                                            </span>
                                            <div className="flex flex-col items-start leading-none gap-0.5">
                                                <span>{item.native}</span>
                                                <span className="text-[10px] opacity-50">{item.label}</span>
                                            </div>
                                        </div>
                                        {language === item.code && <CheckCircle className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Link href="/technician/tasks?filter=in_progress" className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 backdrop-blur-xl rounded-xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all block">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-emerald-300/70">{t.todayTasks}</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{todayTasks}</p>
                </Link>

                <Link href="/technician/tasks?filter=resolved" className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-xl rounded-xl p-5 border border-green-500/20 hover:border-green-500/40 transition-all block">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/30 flex items-center justify-center text-green-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-green-300/70">{t.completed}</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{completedToday}</p>
                </Link>

                <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-xl rounded-xl p-5 border border-red-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/30 flex items-center justify-center text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-red-300/70">{t.urgent}</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{urgentTasks}</p>
                </div>
            </div>

            {/* Today's Tasks (Pending/In Progress only) */}
            <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        {t.assignedTasks}
                    </h2>
                    <Link
                        href="/technician/tasks"
                        className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                    >
                        {t.viewAll}
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {tasks.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{t.allCaughtUp}</h3>
                        <p className="text-gray-400">{t.noTasks}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {tasks
                            .filter(t => t.status !== 'resolved') // Hide resolved from Pending list
                            .slice(0, 5)
                            .map((task) => {
                                const priority = getPriorityConfig(task.priority);

                                return (
                                    <div
                                        key={task.id}
                                        className="p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-all"
                                    >
                                        {/* Image */}
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                            {task.image_url ? (
                                                <img src={task.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-3xl text-gray-600">
                                                        {getCategoryIcon(task.category)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${priority.color} ${priority.bg} ${priority.border} border`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                                    {task.category.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <p className="text-gray-400 text-sm flex items-center gap-1 mb-1">
                                                <MapPin className="w-3 h-3" />
                                                {task.address.slice(0, 50)}...
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>{t.reportedBy}: {task.user_name}</span>
                                                {task.user_phone && (
                                                    <a href={`tel:${task.user_phone}`} className="text-emerald-400 hover:underline">
                                                        {task.user_phone}
                                                    </a>
                                                )}
                                                <span>{formatTimeAgo(task.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all"
                                            >
                                                <Navigation className="w-4 h-4" />
                                                {t.directions}
                                            </a>
                                            <Link
                                                href={`/technician/tasks/${task.id}`}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-all"
                                            >
                                                <Camera className="w-4 h-4" />
                                                {t.resolve}
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>


        </div>
    );
}
