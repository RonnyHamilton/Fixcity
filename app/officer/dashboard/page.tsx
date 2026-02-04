'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    AlertTriangle, Clock, CheckCircle, TrendingUp,
    MapPin, ChevronRight, Filter, MoreVertical,
    ArrowUpRight, Users, Wrench, X, Search, Calendar, Shield
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
    report_count?: number;
    parent_report_id?: string | null;
    resolution_notes?: string;
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
        rejected: canonicalReports.filter(r => r.status === 'rejected').length,
        total: activeCanonicalReports.length,
    };

    const filteredReports = filter === 'all'
        ? activeCanonicalReports.filter(r => r.status === 'pending' || r.status === 'in_progress')
        : activeCanonicalReports.filter(r => r.status === filter);


    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            urgent: { color: 'text-red-600', bg: 'bg-red-50', label: 'Urgent' },
            high: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High' },
            medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
            low: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Low' },
        };
        return configs[priority] || configs.low;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            pending: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Pending' },
            in_progress: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'In Progress' },
            resolved: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Resolved' },
            rejected: { color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' },
        };
        return configs[status] || configs.pending;
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[3px]">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <Shield className="w-10 h-10 text-blue-600" />
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-400 border-4 border-white rounded-full"></div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800">{user?.name || 'Officer'}</h2>
                    <p className="text-sm text-slate-500 font-medium mb-6 uppercase tracking-wide">{user?.area || 'Municipal District'}</p>

                    <div className="grid grid-cols-3 gap-2 w-full pt-6 border-t border-slate-100">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-slate-800">{stats.pending}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Pending</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-slate-100">
                            <span className="text-lg font-bold text-slate-800">{stats.inProgress}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Active</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-slate-100">
                            <span className="text-lg font-bold text-slate-800">{stats.resolved}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Done</span>
                        </div>
                    </div>
                </div>

                {/* Mini Calendar / Status Widget (Visual Only filler for spacing if needed, or just specific stats) */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[24px] p-6 shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield className="w-32 h-32" />
                    </div>
                    <p className="text-indigo-200 text-sm font-medium mb-1">System Status</p>
                    <h3 className="text-2xl font-bold mb-4">Operational</h3>
                    <div className="flex items-center gap-2 text-sm text-indigo-200">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        All systems active
                    </div>
                </div>
            </div>

            {/* CENTER COLUMN - KPIs & Main Reports List (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
                {/* Header Welcome */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name?.split(' ')[0]}</h1>
                        <p className="text-slate-500">Your city issue oversight module</p>
                    </div>
                    {/* Date Pill */}
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Card 1 */}
                    <div className="bg-gradient-to-br from-[#FF9A9E] to-[#FECFEF] rounded-[24px] p-6 text-white shadow-sm relative overflow-hidden group">
                        <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="mt-8">
                            <h3 className="text-4xl font-bold mb-1">{stats.pending + stats.urgent}</h3>
                            <p className="font-medium text-white/90">Pending Issues</p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] rounded-[24px] p-6 text-white shadow-sm relative overflow-hidden group">
                        <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="mt-8">
                            <h3 className="text-4xl font-bold mb-1">{stats.inProgress}</h3>
                            <p className="font-medium text-white/90">In Progress</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Prioritized Tasks</h2>
                    <div className="flex gap-2">
                        {['all', 'pending', 'in_progress'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === f
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f.replace('_', ' ').charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reports Feed */}
                <div className="space-y-4">
                    {filteredReports.length === 0 ? (
                        <div className="bg-white rounded-[24px] p-12 text-center border dashed border-slate-200 border-2">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 font-medium">No tasks found</p>
                            <p className="text-slate-400 text-sm">Great job keeping the city clean!</p>
                        </div>
                    ) : (
                        filteredReports.map((report) => {
                            const priority = getPriorityConfig(report.priority);
                            const status = getStatusConfig(report.status);

                            return (
                                <div
                                    key={report.id}
                                    onClick={() => router.push(`/officer/reports/${report.id}`)}
                                    className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Image Thumbnail */}
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                                            {report.image_url ? (
                                                <img src={report.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <MapPin className="w-8 h-8" />
                                                </div>
                                            )}
                                            {(report.report_count || 1) > 1 && (
                                                <div className="absolute top-1 right-1 bg-purple-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                                    +{report.report_count}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priority.color} ${priority.bg}`}>
                                                    {priority.label} Priority
                                                </span>
                                                <span className="text-xs text-slate-400">{formatTimeAgo(report.created_at)}</span>
                                            </div>

                                            <h3 className="font-bold text-slate-800 text-base mb-1 truncate">{report.category}</h3>

                                            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-3">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{report.address}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${status.color} ${status.bg}`}>
                                                    {status.label}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    {(report.status === 'pending' || report.status === 'in_progress') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReportToReject(report.id);
                                                                setShowRejectModal(true);
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-white border border-red-100 hover:bg-red-50 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN - Technicians & Activity (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Technicians</h3>
                        <button onClick={() => router.push('/officer/technicians')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {technicians.slice(0, 5).map((tech) => (
                            <div key={tech.id} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${tech.available ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {tech.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800 truncate">{tech.name}</h4>
                                    <p className="text-xs text-slate-500 truncate">{tech.specialization}</p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${tech.available ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => router.push('/officer/technicians')} className="w-full mt-6 py-2.5 text-xs font-semibold text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        View All Technicians
                    </button>
                </div>

                {/* Most Reported Widget (Simplistic) */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Top Issues</h3>
                    <div className="space-y-3">
                        {stats.urgent > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Urgent</span>
                                <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400 w-[70%] rounded-full"></div>
                                </div>
                                <span className="text-xs font-bold text-slate-800">{stats.urgent}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Pending</span>
                            <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-[45%] rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-slate-800">{stats.pending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Active</span>
                            <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-400 w-[20%] rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-slate-800">{stats.inProgress}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !rejecting && setShowRejectModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            Reject Report
                        </h3>
                        <p className="text-slate-500 mb-4 text-sm">
                            Please provide a reason. This will be visible to the citizen.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors h-32 resize-none text-sm"
                            placeholder="Reason for rejection..."
                            disabled={rejecting}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                    setReportToReject(null);
                                }}
                                disabled={rejecting}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectReport}
                                disabled={!rejectionReason.trim() || rejecting}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

