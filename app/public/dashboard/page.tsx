'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { FileText, CheckCircle, Clock, AlertCircle, Plus, TrendingUp, Eye, X, MapPin, Calendar, Tag, User, AlertTriangle, Trash2, Phone, BadgeCheck } from 'lucide-react';

interface Report {
    id: string;
    user_id: string;
    user_name: string;
    category: string;
    description: string;
    image_url: string;
    address: string;
    latitude: number;
    longitude: number;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
    resolution_notes?: string;
    assigned_technician_id?: string;
}

export default function PublicDashboard() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';
    const { user } = useAuthStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    // Delete state
    const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
    const [deletionReason, setDeletionReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Technician details state
    const [assignedTechnician, setAssignedTechnician] = useState<any>(null);

    useEffect(() => {
        if (selectedReport?.assigned_technician_id) {
            // Fetch technician details
            import('@/data/technicians.json').then((mod) => {
                const technician = mod.default.find(t => t.id === selectedReport.assigned_technician_id);
                setAssignedTechnician(technician || null);
            });
        } else {
            setAssignedTechnician(null);
        }
    }, [selectedReport]);

    useEffect(() => {
        if (user?.id) {
            fetchUserReports();
        } else {
            console.log("User not loaded yet");
        }
    }, [user?.id]);

    const fetchUserReports = async () => {
        try {
            // Fetch only reports from this user
            const response = await fetch(`/api/reports?userId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, reportId: string) => {
        e.stopPropagation(); // Prevent opening details modal if clicked on card
        setDeletingReportId(reportId);
        setDeletionReason('');
    };

    const confirmDelete = async () => {
        if (!deletingReportId) return;
        if (!deletionReason.trim()) {
            alert('Please provide a reason for deletion');
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/reports?id=${deletingReportId}&reason=${encodeURIComponent(deletionReason)}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove from local state immediately
                setReports(reports.filter(r => r.id !== deletingReportId));
                setDeletingReportId(null);

                // If the deleted report was currently open in details modal, close it
                if (selectedReport?.id === deletingReportId) {
                    setSelectedReport(null);
                }
            } else {
                alert('Failed to delete report. Please try again.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred while deleting.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Calculate stats from user's reports only
    const stats = {
        total: reports.length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        pending: reports.filter(r => r.status === 'pending').length,
    };

    const getStatusBadge = (status: Report['status']) => {
        const badges = {
            pending: { color: 'bg-orange-500', text: 'Pending Review', icon: Clock },
            in_progress: { color: 'bg-blue-500', text: 'In Progress', icon: TrendingUp },
            resolved: { color: 'bg-green-500', text: 'Resolved', icon: CheckCircle },
            rejected: { color: 'bg-red-500', text: 'Rejected', icon: AlertCircle },
        };
        return badges[status];
    };

    const getPriorityBadge = (priority: Report['priority']) => {
        const badges = {
            low: { color: 'bg-slate-500', text: 'Low' },
            medium: { color: 'bg-yellow-500', text: 'Medium' },
            high: { color: 'bg-orange-500', text: 'High' },
            urgent: { color: 'bg-red-500', text: 'Urgent' },
        };
        return badges[priority];
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            pothole: 'edit_road',
            garbage: 'delete',
            'e-waste': 'devices',
            streetlight: 'lightbulb',
            graffiti: 'format_paint',
            broken_sidewalk: 'directions_walk',
            water_leak: 'water_drop',
            sewage: 'plumbing',
            fallen_tree: 'park',
            other: 'more_horiz',
        };
        return icons[category] || 'report';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRelativeDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="w-full">
            {/* Welcome Banner */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 py-4">
                <div>
                    <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-tighter mb-3 drop-shadow-lg">
                        Welcome back, <span className="text-primary">{user?.name || 'User'}</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium max-w-2xl">
                        Track your contributions to a better city. Here's what needs attention today.
                    </p>
                </div>
                <Link
                    href="/public/report"
                    className="flex items-center justify-center gap-2 h-12 px-6 bg-primary hover:bg-primary-hover rounded-xl text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98] border border-white/10"
                >
                    <Plus className="w-5 h-5" />
                    Report New Issue
                </Link>
            </div>

            {/* Stats Cards - Only show if user has reports */}
            {reports.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20" />
                        <div className="flex items-center gap-3 text-slate-300 mb-4 relative z-10">
                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Reports</p>
                        </div>
                        <p className="text-white text-4xl font-black relative z-10">{stats.total}</p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20" />
                        <div className="flex items-center gap-3 text-green-400 mb-4 relative z-10">
                            <div className="p-2 rounded-xl bg-green-500/20 border border-green-500/20">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Resolved</p>
                        </div>
                        <p className="text-white text-4xl font-black relative z-10">{stats.resolved}</p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-blue-400/20" />
                        <div className="flex items-center gap-3 text-blue-400 mb-4 relative z-10">
                            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/20">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
                        </div>
                        <p className="text-white text-4xl font-black relative z-10">{stats.inProgress}</p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-orange-500/20" />
                        <div className="flex items-center gap-3 text-orange-400 mb-4 relative z-10">
                            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/20">
                                <Clock className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                        </div>
                        <p className="text-white text-4xl font-black relative z-10">{stats.pending}</p>
                    </div>
                </div>
            )}

            {/* Reports List */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : reports.length === 0 ? (
                /* Empty State */
                <div className="text-center py-24 glass-panel rounded-3xl border-dashed border-2 border-white/5">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_-10px_var(--primary)]">
                        <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Reports Yet</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                        You haven&apos;t reported any issues yet. Help improve your community by reporting infrastructure problems nearby.
                    </p>
                    <Link
                        href="/public/report"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        Report Your First Issue
                    </Link>
                </div>
            ) : (
                /* Reports Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.filter(r =>
                        !searchQuery ||
                        r.description.toLowerCase().includes(searchQuery) ||
                        r.category.toLowerCase().includes(searchQuery) ||
                        r.address.toLowerCase().includes(searchQuery) ||
                        r.id.toLowerCase().includes(searchQuery)
                    ).map((report) => {
                        const statusBadge = getStatusBadge(report.status);

                        return (
                            <article
                                key={report.id}
                                className="glass-card rounded-2xl overflow-hidden flex flex-col group relative h-full"
                            >
                                {/* Delete Button (Top Right) */}
                                {report.status === 'pending' && (
                                    <button
                                        onClick={(e) => handleDeleteClick(e, report.id)}
                                        className="absolute top-3 right-3 z-20 p-2.5 rounded-full bg-black/60 hover:bg-red-500 text-white/80 hover:text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
                                        title="Delete Report"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Image */}
                                <div className="relative h-56 bg-slate-900 overflow-hidden">
                                    {report.image_url ? (
                                        <img
                                            src={report.image_url}
                                            alt={report.category}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <span className="material-symbols-outlined text-6xl text-slate-700">
                                                {getCategoryIcon(report.category)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-90" />

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg border border-white/10 flex items-center gap-2 text-white">
                                        <span className={`w-2 h-2 rounded-full ${statusBadge.color} ${report.status === 'in_progress' ? 'animate-pulse' : ''}`} />
                                        {statusBadge.text}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 bg-primary/10 inline-block px-2 py-1 rounded-md border border-primary/20">
                                                {report.category.replace('_', ' ')}
                                            </div>
                                            <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                                {report.description}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3 bg-white/5 p-2 rounded-lg">
                                        <span className="whitespace-nowrap">{formatRelativeDate(report.created_at)}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                        <span className="truncate">{report.address}</span>
                                    </div>

                                    <p className="text-sm text-slate-400 mb-6 line-clamp-2 h-10">{report.description}</p>

                                    {/* View Details Button */}
                                    <div className="mt-auto pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary/50 text-slate-300 text-sm font-bold py-3 rounded-xl transition-all group/btn"
                                        >
                                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectedReport(null)}
                    />

                    {/* Modal */}
                    <div className="relative glass-panel rounded-3xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-white/10 text-white transition-colors z-20 backdrop-blur-md border border-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image */}
                        {selectedReport.image_url && (
                            <div className="relative h-72 bg-gray-900 group">
                                <img
                                    src={selectedReport.image_url}
                                    alt={selectedReport.category}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-dark)] to-transparent" />
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6 md:p-8 relative">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                            {selectedReport.category.replace('_', ' ')}
                                        </span>
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${getPriorityBadge(selectedReport.priority).color} text-white`}>
                                            {getPriorityBadge(selectedReport.priority).text} Priority
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Report Details</h2>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${getStatusBadge(selectedReport.status).color} text-white shadow-lg`}>
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    {getStatusBadge(selectedReport.status).text}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-4">
                                {/* Description */}
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-white text-lg leading-relaxed">{selectedReport.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                                            <p className="text-white mb-1">{selectedReport.address}</p>
                                            {selectedReport.latitude && selectedReport.longitude && (
                                                <p className="text-xs text-slate-500 font-mono bg-black/20 px-2 py-1 rounded inline-block">
                                                    {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported</p>
                                            <p className="text-white font-medium">{formatDate(selectedReport.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID</p>
                                            <p className="text-white font-mono text-sm">{selectedReport.id}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Resolution Notes */}
                                {selectedReport.status === 'resolved' && selectedReport.resolution_notes && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Resolution Notes</p>
                                                <p className="text-white">{selectedReport.resolution_notes}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Technician Contact Card */}
                                {assignedTechnician && (selectedReport.status === 'in_progress' || selectedReport.status === 'resolved') && (
                                    <div className="mt-6 p-1 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                                        <div className="bg-[#0f172a] rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <BadgeCheck className="w-5 h-5 text-blue-400" />
                                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Assigned Technician</h3>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl border border-blue-500/30">
                                                        {assignedTechnician.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-lg">{assignedTechnician.name}</p>
                                                        <p className="text-xs text-slate-400">ID: {assignedTechnician.badge_id}</p>
                                                    </div>
                                                </div>
                                                {assignedTechnician.phone && (
                                                    <a
                                                        href={`tel:${assignedTechnician.phone}`}
                                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        <span>Call Technician</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                                {selectedReport.status === 'pending' && (
                                    <button
                                        onClick={(e) => {
                                            handleDeleteClick(e, selectedReport.id);
                                        }}
                                        className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-900/20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Report
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingReportId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        onClick={() => !isDeleting && setDeletingReportId(null)}
                    />

                    <div className="relative glass-panel rounded-3xl border border-red-500/20 shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-6 text-red-400">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Delete Report?</h3>
                                <p className="text-xs text-red-400 font-mono mt-1">ID: {deletingReportId}</p>
                            </div>
                        </div>

                        <p className="text-slate-300 mb-6 leading-relaxed">
                            This action cannot be undone. To verify this deletion, please provide a reason below.
                        </p>

                        <div className="mb-8">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Reason for Deletion</label>
                            <textarea
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none h-32 resize-none placeholder:text-slate-600"
                                placeholder="E.g., duplicate report, issue resolved, etc..."
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeletingReportId(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting || !deletionReason.trim()}
                                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        Delete Forever
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
