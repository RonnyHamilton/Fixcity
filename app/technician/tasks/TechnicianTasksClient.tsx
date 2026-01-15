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
            urgent: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
            high: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
            medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
            low: { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
        };
        return configs[priority] || configs.low;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            in_progress: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'In Progress' },
            resolved: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Completed' },
            pending: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Pending' },
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
                    <h1 className="text-2xl font-bold text-white">{t.allTasks}</h1>
                    <p className="text-gray-400">{tasks.length} total tasks assigned</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        placeholder="Search tasks..."
                    />
                </div>

                <div className="flex gap-2">
                    {['all', 'in_progress', 'resolved'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Tasks Found</h3>
                    <p className="text-gray-400">
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
                                className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-all"
                            >
                                <div className="flex">
                                    {/* Image */}
                                    <div className="w-32 h-full flex-shrink-0">
                                        {task.image_url ? (
                                            <img src={task.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                <MapPin className="w-8 h-8 text-gray-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${priority.color} ${priority.bg}`}>
                                                {task.priority}
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.color} ${status.bg}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-white mb-1">{task.category}</h3>
                                        <p className="text-gray-400 text-sm flex items-center gap-1 mb-2">
                                            <MapPin className="w-3 h-3" />
                                            {task.address.slice(0, 40)}...
                                        </p>

                                        <div className="flex flex-col gap-0.5 mb-3 text-xs text-gray-500">
                                            <span>Reported by: {task.user_name}</span>
                                            {task.user_phone && (
                                                <a href={`tel:${task.user_phone}`} className="text-emerald-400 hover:underline w-fit">
                                                    {task.user_phone}
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {task.status !== 'resolved' && (
                                                <>
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all"
                                                    >
                                                        <Navigation className="w-3 h-3" />
                                                        {t.directions}
                                                    </a>
                                                    <Link
                                                        href={`/technician/tasks/${task.id}`}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-all"
                                                    >
                                                        <Camera className="w-3 h-3" />
                                                        {t.resolve}
                                                    </Link>
                                                </>
                                            )}
                                            {task.status === 'resolved' && (
                                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {t.completed}
                                                </span>
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
