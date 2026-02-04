'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
    MapPin, Clock, CheckCircle,
    Navigation, Camera, Search
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

function TechnicianTasksContent() {
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get('filter') || 'all';
    const { user, language } = useAuthStore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(initialFilter);
    const [searchQuery, setSearchQuery] = useState('');
    const t = translations[language];

    useEffect(() => {
        if (user?.id) fetchTasks();
    }, [user?.id]);

    const fetchTasks = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch('/api/reports');
            if (response.ok) {
                const data = await response.json();
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

    // Filter tasks
    let filteredTasks = tasks;

    if (filter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.status === filter);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredTasks = filteredTasks.filter(t =>
            t.description.toLowerCase().includes(query) ||
            t.address.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
        );
    }

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string; border: string }> = {
            urgent: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100' },
            high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
            medium: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-100' },
            low: { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-100' },
        };
        return configs[priority] || configs.low;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            in_progress: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'In Progress' },
            resolved: { color: 'text-green-700', bg: 'bg-green-50', label: 'Completed' },
            pending: { color: 'text-orange-700', bg: 'bg-orange-50', label: 'Pending' },
        };
        return configs[status] || configs.pending;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
                    <h1 className="text-2xl font-bold text-slate-800">{t.allTasks}</h1>
                    <p className="text-slate-500">{tasks.length} total tasks assigned</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm"
                        placeholder="Search tasks..."
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {['all', 'in_progress', 'resolved'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${filter === f
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Tasks Found</h3>
                    <p className="text-slate-500">
                        {searchQuery ? 'No tasks match your search' : 'No tasks with this status'}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {filteredTasks.map((task) => {
                        const priority = getPriorityConfig(task.priority);
                        const status = getStatusConfig(task.status);

                        return (
                            <div
                                key={task.id}
                                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col relative group"
                            >
                                <div className="flex flex-col sm:flex-row h-full">
                                    {/* Image */}
                                    <div className="w-full h-48 sm:w-32 sm:h-auto flex-shrink-0 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none bg-slate-100">
                                        {task.image_url ? (
                                            <img src={task.image_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <MapPin className="w-8 h-8 text-slate-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 flex flex-col min-w-0">
                                        <div className="flex items-center flex-wrap gap-2 mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${priority.color} ${priority.bg} border ${priority.border}`}>
                                                {task.priority}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${status.color} ${status.bg}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{task.category}</h3>
                                        <p className="text-slate-500 text-sm flex items-center gap-1 mb-3">
                                            <MapPin className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                                            <span className="truncate">{task.address}</span>
                                        </p>

                                        <div className="flex flex-col gap-1 mb-4 text-xs text-slate-500 flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="flex justify-between items-center">
                                                <span>Reporter:</span>
                                                <span className="text-slate-700 font-bold truncate ml-2">{task.user_name}</span>
                                            </div>
                                            {task.user_phone && (
                                                <div className="flex justify-between items-center">
                                                    <span>Phone:</span>
                                                    <a href={`tel:${task.user_phone}`} className="text-emerald-600 hover:underline font-bold ml-2">
                                                        {task.user_phone}
                                                    </a>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span>Reported:</span>
                                                <span className="text-slate-700 ml-2">{formatDate(task.created_at)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 mt-auto pt-3 border-t border-slate-100">
                                            {task.status !== 'resolved' && (
                                                <>
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all min-w-[120px] whitespace-nowrap"
                                                    >
                                                        <Navigation className="w-4 h-4" />
                                                        {t.directions}
                                                    </a>
                                                    <Link
                                                        href={`/technician/tasks/${task.id}`}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/40 transition-all min-w-[120px] whitespace-nowrap"
                                                    >
                                                        <Camera className="w-4 h-4" />
                                                        {t.resolve}
                                                    </Link>
                                                </>
                                            )}
                                            {task.status === 'resolved' && (
                                                <Link
                                                    href={`/technician/tasks/${task.id}`}
                                                    className="flex items-center justify-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm font-bold w-full py-2.5 rounded-xl transition-all"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    {t.completed}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

}

export default function TechnicianTasksClient() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        }>
            <TechnicianTasksContent />
        </Suspense>
    );
}
