'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    AlertTriangle, Clock, CheckCircle, TrendingUp,
    MapPin, User, ChevronRight, Filter, MoreVertical,
    ArrowUpRight, ArrowDownRight, Users, Wrench
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Report {
    id: string;
    user_id: string;
    user_name: string;
    category: string;
    description: string;
    image_url: string;
    address: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_technician_id?: string;
    created_at: string;
    duplicate_count?: number;
    parent_report_id?: string | null;
}

interface Technician {
    id: string;
    name: string;
    badge_id: string;
    area: string;
    specialization: string;
    available: boolean;
}

export default function OfficerDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reportsRes, techRes] = await Promise.all([
                fetch('/api/reports'),
                fetch('/api/technicians'),
            ]);

            if (reportsRes.ok) {
                const data = await reportsRes.json();
                setReports(data.reports || []);
            }

            if (techRes.ok) {
                const data = await techRes.json();
                setTechnicians(data.technicians || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter reports - exclude child reports (only show canonical reports)
    const canonicalReports = reports.filter(r => !r.parent_report_id);

    // Calculate stats from canonical reports only (excludes duplicates)
    const stats = {
        urgent: canonicalReports.filter(r => r.priority === 'urgent' && r.status === 'pending').length,
        pending: canonicalReports.filter(r => r.status === 'pending').length,
        inProgress: canonicalReports.filter(r => r.status === 'in_progress').length,
        resolved: canonicalReports.filter(r => r.status === 'resolved').length,
        total: canonicalReports.length,
    };



    const filteredReports = filter === 'all'
        ? canonicalReports.filter(r => r.status === 'pending')
        : canonicalReports.filter(r => r.status === filter);

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            urgent: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgent' },
            high: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
            medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Medium' },
            low: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Low' },
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome, {user?.name}</h1>
                    <p className="text-gray-400">{user?.area} • Officer Dashboard</p>
                </div>
                <div className="flex items-center gap-2">
                    <select className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm">
                        <option className="bg-[#0f172a] text-white">Last 7 days</option>
                        <option className="bg-[#0f172a] text-white">Last 30 days</option>
                        <option className="bg-[#0f172a] text-white">This Month</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-xl rounded-xl p-5 border border-red-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/30 flex items-center justify-center text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="flex items-center gap-1 text-red-400 text-sm font-medium bg-red-500/20 px-2 py-0.5 rounded">
                            <ArrowUpRight className="w-3 h-3" />
                            +3
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.urgent}</p>
                    <p className="text-sm text-red-300/70">Urgent Issues</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 backdrop-blur-xl rounded-xl p-5 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/30 flex items-center justify-center text-orange-400">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.pending}</p>
                    <p className="text-sm text-orange-300/70">Pending Review</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 backdrop-blur-xl rounded-xl p-5 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.inProgress}</p>
                    <p className="text-sm text-blue-300/70">In Progress</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-xl rounded-xl p-5 border border-green-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/30 flex items-center justify-center text-green-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-500/20 px-2 py-0.5 rounded">
                            <ArrowUpRight className="w-3 h-3" />
                            +12
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.resolved}</p>
                    <p className="text-sm text-green-300/70">Resolved Today</p>
                </div>
            </div>

            {/* Task Assignment Overview */}
            <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-primary" />
                            Task Assignments
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Overview of technician workload distribution
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/officer/technicians')}
                        className="px-3 py-1.5 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                        View All
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {technicians.slice(0, 6).map((tech) => {
                        const assignedTasks = canonicalReports.filter(
                            r => r.assigned_technician_id === tech.id
                        );
                        const activeTasks = assignedTasks.filter(r => r.status === 'in_progress');
                        const completedTasks = assignedTasks.filter(r => r.status === 'resolved');
                        const totalAssigned = assignedTasks.length;

                        return (
                            <div
                                key={tech.id}
                                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tech.available
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            <Wrench className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{tech.name}</p>
                                            <p className="text-gray-500 text-xs">{tech.specialization}</p>
                                        </div>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${tech.available ? 'bg-green-400' : 'bg-gray-500'
                                        }`} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">Total Assigned</span>
                                        <span className="text-white font-medium">{totalAssigned}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            In Progress
                                        </span>
                                        <span className="text-blue-400 font-medium">{activeTasks.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Completed
                                        </span>
                                        <span className="text-green-400 font-medium">{completedTasks.length}</span>
                                    </div>
                                </div>

                                {totalAssigned > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all"
                                                style={{ width: `${(completedTasks.length / totalAssigned) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {Math.round((completedTasks.length / totalAssigned) * 100)}% completion rate
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {technicians.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No technicians available</p>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Reports List */}
                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
                    {/* Filters */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex gap-2">
                            {['all', 'pending', 'in_progress'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? 'bg-primary text-white'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {f === 'all' ? 'Active' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>

                    {/* Reports */}
                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                        {filteredReports.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-400">No reports to display</p>
                            </div>
                        ) : (
                            filteredReports.map((report) => {
                                const priority = getPriorityConfig(report.priority);

                                return (
                                    <div
                                        key={report.id}
                                        onClick={() => router.push(`/officer/reports/${report.id}`)}
                                        className="p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/[0.05] group"
                                    >
                                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative group-hover:ring-2 ring-primary/50 transition-all">
                                            {report.image_url ? (
                                                <img src={report.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <MapPin className="w-6 h-6 text-gray-600" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${priority.color} ${priority.bg}`}>
                                                    {priority.label}
                                                </span>
                                                {(report.duplicate_count || 0) > 0 && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">content_copy</span>
                                                        {report.duplicate_count} linked
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">#{report.id.slice(-6)}</span>
                                            </div>
                                            <p className="text-white font-medium text-sm mb-1 line-clamp-1">{report.description}</p>
                                            <p className="text-gray-400 text-xs flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {report.address.slice(0, 40)}...
                                            </p>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-gray-500">{formatTimeAgo(report.created_at)}</p>
                                            <ChevronRight className="w-4 h-4 text-gray-500 mt-2 ml-auto group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

