'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    AlertTriangle, Clock, CheckCircle, TrendingUp,
    MapPin, User, ChevronRight, Filter, MoreVertical,
    ArrowUpRight, ArrowDownRight, Users, Wrench, X
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
    report_count?: number; // Changed from duplicate_count to match schema
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
    const [rejecting, setRejecting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [reportToReject, setReportToReject] = useState<string | null>(null);

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

    // Filter reports - exclude child reports AND rejected reports from main view
    const canonicalReports = reports.filter(r => !r.parent_report_id);

    // Active reports only (excludes rejected) - used for main display
    const activeCanonicalReports = canonicalReports.filter(r => r.status !== 'rejected');

    // Calculate stats from canonical reports only (excludes duplicates)
    const stats = {
        urgent: activeCanonicalReports.filter(r => r.priority === 'urgent' && r.status === 'pending').length,
        pending: activeCanonicalReports.filter(r => r.status === 'pending').length,
        inProgress: activeCanonicalReports.filter(r => r.status === 'in_progress').length,
        resolved: activeCanonicalReports.filter(r => r.status === 'resolved').length,
        rejected: canonicalReports.filter(r => r.status === 'rejected').length, // Track rejected separately
        total: activeCanonicalReports.length,
    };



    const filteredReports = filter === 'all'
        ? activeCanonicalReports.filter(r => r.status === 'pending')
        : activeCanonicalReports.filter(r => r.status === filter);


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

    const handleRejectReport = async () => {
        if (!reportToReject || !rejectionReason.trim()) return;

        setRejecting(true);
        try {
            const response = await fetch(`/api/reports/${reportToReject}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Refresh data to show updated list
                await fetchData();
                setShowRejectModal(false);
                setRejectionReason('');
                setReportToReject(null);
            } else {
                console.error('Failed to reject report:', data.error || data);
                alert(`Failed to reject report: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error rejecting report:', error);
            alert('Network error while rejecting report');
        } finally {
            setRejecting(false);
        }
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome, {user?.name}</h1>
                    <p className="text-gray-400">{user?.area} • Officer Dashboard</p>
                </div>
                <div className="flex items-center gap-2">
                    <select className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm w-full sm:w-auto">
                        <option className="bg-[#0f172a] text-white">Last 7 days</option>
                        <option className="bg-[#0f172a] text-white">Last 30 days</option>
                        <option className="bg-[#0f172a] text-white">This Month</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Most Reported Issues Widget */}
            {(() => {
                const mostReported = activeCanonicalReports
                    .filter(r => (r.report_count || 1) > 1)
                    .sort((a, b) => (b.report_count || 1) - (a.report_count || 1))
                    .slice(0, 3);

                if (mostReported.length === 0) return null;


                return (
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            Most Reported Issues
                        </h3>
                        <div className="space-y-3">
                            {mostReported.map((report, index) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/officer/reports/${report.id}`)}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="text-2xl font-bold text-purple-400 flex-shrink-0">
                                            #{index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-white font-medium truncate">{report.category}</p>
                                            <p className="text-gray-400 text-sm truncate">{report.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm font-semibold rounded">
                                            {report.report_count || 1} reports
                                        </span>
                                        <span className={`px-2 py-1 ${getPriorityConfig(report.priority).bg} ${getPriorityConfig(report.priority).color} text-xs font-medium rounded`}>
                                            {getPriorityConfig(report.priority).label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                                {(report.report_count || 1) > 1 && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">content_copy</span>
                                                        {report.report_count} reports
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

                                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                            <p className="text-xs text-gray-500">{formatTimeAgo(report.created_at)}</p>
                                            {(report.status === 'pending' || report.status === 'in_progress') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReportToReject(report.id);
                                                        setShowRejectModal(true);
                                                    }}
                                                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded flex items-center gap-1 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                    Reject
                                                </button>
                                            )}
                                            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => !rejecting && setShowRejectModal(false)}
                    />
                    <div className="relative bg-[#1e293b] rounded-2xl border border-red-500/30 shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <X className="w-6 h-6 text-red-400" />
                            Reject Report
                        </h3>
                        <p className="text-gray-300 mb-4 text-sm">
                            Please provide a reason for rejecting this report. The citizen will see this reason.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-[#0f172a] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition-colors h-32 resize-none"
                            placeholder="e.g., Insufficient evidence, duplicate report, outside jurisdiction..."
                            disabled={rejecting}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                    setReportToReject(null);
                                }}
                                disabled={rejecting}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectReport}
                                disabled={!rejectionReason.trim() || rejecting}
                                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {rejecting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Rejecting...
                                    </>
                                ) : (
                                    'Reject'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

