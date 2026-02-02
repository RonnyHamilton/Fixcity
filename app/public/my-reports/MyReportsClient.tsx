'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Plus, X, MapPin, Calendar, Tag, Trash2, Phone, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parseResolutionNotes } from '@/lib/resolution-utils';

interface Report {
    id: string;
    user_name: string;
    category: string;
    description: string;
    image_url: string;
    address: string;
    latitude: number;
    longitude: number;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_technician_id?: string;
    resolution_notes?: string;
    created_at: string;
    updated_at: string;
}

interface PublicUser {
    id: string;
    name: string;
    email: string;
}

function MyReportsContent() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';
    const [user, setUser] = useState<PublicUser | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    // Delete state
    const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
    const [deletionReason, setDeletionReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Technician details state
    const [assignedTechnician, setAssignedTechnician] = useState<any>(null);

    // Fetch user from URL params
    useEffect(() => {
        const uid = searchParams.get('uid');
        if (!uid) return;

        const fetchUser = async () => {
            const { data } = await supabase
                .from('public_users')
                .select('id, name, email')
                .eq('id', uid)
                .single();

            if (data) {
                setUser(data);
            }
        };

        fetchUser();
    }, [searchParams]);

    useEffect(() => {
        if (selectedReport?.assigned_technician_id) {
            // Fetch technician details
            import('@/data/technicians.json').then((mod) => {
                const technician = mod.default.find((t: any) => t.id === selectedReport.assigned_technician_id);
                setAssignedTechnician(technician || null);
            });
        } else {
            setAssignedTechnician(null);
        }
    }, [selectedReport]);

    useEffect(() => {
        if (user?.id) fetchReports();
    }, [user?.id]);

    const fetchReports = async () => {
        try {
            const response = await fetch(`/api/reports?userId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                // Filter out duplicates - only show canonical reports (parent_report_id is null)
                const canonicalReports = (data.reports || []).filter((r: any) => !r.parent_report_id);
                setReports(canonicalReports);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, reportId: string) => {
        e.stopPropagation();
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
                setReports(reports.filter(r => r.id !== deletingReportId));
                setDeletingReportId(null);
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

    const filteredReports = reports.filter(r => {
        const matchesStatus = filter === 'all' || r.status === filter;
        const matchesSearch = !searchQuery ||
            r.description.toLowerCase().includes(searchQuery) ||
            r.category.toLowerCase().includes(searchQuery) ||
            r.address.toLowerCase().includes(searchQuery) ||
            r.id.toLowerCase().includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    const getStatusConfig = (status: Report['status']) => {
        const configs = {
            pending: {
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                border: 'border-orange-500/30',
                icon: Clock,
                label: 'Pending Review'
            },
            in_progress: {
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/30',
                icon: Clock,
                label: 'In Progress'
            },
            resolved: {
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                border: 'border-green-500/30',
                icon: CheckCircle,
                label: 'Resolved'
            },
            rejected: {
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                border: 'border-red-500/30',
                icon: AlertCircle,
                label: 'Rejected'
            },
        };
        return configs[status];
    };

    const getPriorityBadge = (priority: Report['priority']) => {
        const badges = {
            low: { color: 'bg-gray-500', text: 'Low' },
            medium: { color: 'bg-yellow-500', text: 'Medium' },
            high: { color: 'bg-orange-500', text: 'High' },
            urgent: { color: 'bg-red-500', text: 'Urgent' },
        };
        return badges[priority];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            pothole: 'Pothole',
            garbage: 'Garbage',
            'e-waste': 'E-Waste',
            streetlight: 'Street Light',
            graffiti: 'Graffiti',
            broken_sidewalk: 'Broken Sidewalk',
            water_leak: 'Water Leak',
            sewage: 'Sewage',
            fallen_tree: 'Fallen Tree',
            other: 'Other',
        };
        return labels[category] || category;
    };

    return (
        <div className="px-4 sm:px-6 py-8 mx-auto w-full max-w-[1024px]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white mb-1">My Reports</h1>
                    <p className="text-gray-400">Track the status of issues you&apos;ve reported</p>
                </div>
                <Link
                    href={`/public/report?uid=${searchParams.get('uid')}`}
                    className="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-blue-600 rounded-lg text-white text-sm font-bold shadow-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    New Report
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'resolved', label: 'Resolved' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === tab.key
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {tab.label}
                        {tab.key === 'all' && ` (${reports.length})`}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-2xl">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {filter === 'all' ? 'No Reports Yet' : `No ${filter.replace('_', ' ')} Reports`}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {filter === 'all'
                            ? 'Start by reporting an issue in your community'
                            : 'You don\'t have any reports with this status'}
                    </p>
                    {filter === 'all' && (
                        <Link
                            href={`/public/report?uid=${searchParams.get('uid')}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Report an Issue
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReports.map((report) => {
                        const status = getStatusConfig(report.status);
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={report.id}
                                className="glass-panel rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 hover:bg-white/[0.03] transition-all group"
                            >
                                {/* Image */}
                                <div className="w-full md:w-32 h-32 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                                    {report.image_url ? (
                                        <img
                                            src={report.image_url}
                                            alt={report.category}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-gray-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-start gap-2 mb-2">
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                            {getCategoryLabel(report.category)}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${status.color} ${status.bg} ${status.border} border`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${report.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                            report.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                report.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {report.priority}
                                        </span>
                                    </div>

                                    <p className="text-white font-medium mb-1 line-clamp-1">{report.description}</p>
                                    <p className="text-gray-400 text-sm mb-2 line-clamp-1">{report.address}</p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                        <span>Reported: {formatDate(report.created_at)}</span>
                                        {report.status !== 'pending' && (
                                            <span>Updated: {formatDate(report.updated_at)}</span>
                                        )}
                                        {report.assigned_technician_id && (
                                            <span className="text-green-400">Technician Assigned</span>
                                        )}
                                    </div>

                                    {report.resolution_notes && (() => {
                                        const { text, imageUrl } = parseResolutionNotes(report.resolution_notes);
                                        return (
                                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                                                <p className="text-green-400 text-sm font-medium">Resolution Notes:</p>
                                                {text && <p className="text-gray-300 text-sm">{text}</p>}
                                                {imageUrl && (
                                                    <img
                                                        src={imageUrl}
                                                        alt="Resolution proof"
                                                        className="w-full rounded-lg border border-green-500/20"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Actions */}
                                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                                    <span className="text-xs text-gray-500">#{report.id.slice(-6)}</span>
                                    <button
                                        onClick={() => setSelectedReport(report)}
                                        className="flex items-center gap-1 text-primary text-sm font-medium hover:underline group-hover:gap-2 transition-all"
                                    >
                                        View Details
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* Report Details Modal */}
            {
                selectedReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setSelectedReport(null)}
                        />
                        <div className="relative bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {selectedReport.image_url && (
                                <div className="relative h-64 bg-gray-800">
                                    <img
                                        src={selectedReport.image_url}
                                        alt={selectedReport.category}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent" />
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md">
                                                {selectedReport.category.replace('_', ' ')}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${getPriorityBadge(selectedReport.priority).color} text-white`}>
                                                {getPriorityBadge(selectedReport.priority).text} Priority
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Report Details</h2>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusConfig(selectedReport.status).bg} ${getStatusConfig(selectedReport.status).color} border ${getStatusConfig(selectedReport.status).border}`}>
                                        <span className="w-2 h-2 rounded-full bg-current" />
                                        {getStatusConfig(selectedReport.status).label}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                                        <Tag className="w-5 h-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Report ID</p>
                                            <p className="text-white font-mono">{selectedReport.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                                        <FileText className="w-5 h-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Description</p>
                                            <p className="text-white">{selectedReport.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Location</p>
                                            <p className="text-white">{selectedReport.address}</p>
                                            {selectedReport.latitude && selectedReport.longitude && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Coordinates: {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                                            <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Reported On</p>
                                                <p className="text-white text-sm">{formatDate(selectedReport.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                                            <Clock className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                                                <p className="text-white text-sm">{formatDate(selectedReport.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedReport.status === 'resolved' && selectedReport.resolution_notes && (() => {
                                        const { text, imageUrl } = parseResolutionNotes(selectedReport.resolution_notes);
                                        return (
                                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-green-400 mb-1">Resolution Notes</p>
                                                        {text && <p className="text-white">{text}</p>}
                                                    </div>
                                                </div>
                                                {imageUrl && (
                                                    <img
                                                        src={imageUrl}
                                                        alt="Resolution proof"
                                                        className="w-full rounded-lg border border-green-500/30"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Technician Contact Card */}
                                    {assignedTechnician && (selectedReport.status === 'in_progress' || selectedReport.status === 'resolved') && (
                                        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-3">
                                                <BadgeCheck className="w-5 h-5 text-blue-400" />
                                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Assigned Technician</h3>
                                            </div>
                                            <div className="flex items-center justify-between bg-[#0f172a]/50 p-3 rounded-lg border border-blue-500/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
                                                        {assignedTechnician.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold">{assignedTechnician.name}</p>
                                                        <p className="text-xs text-gray-400">ID: {assignedTechnician.badge_id}</p>
                                                    </div>
                                                </div>
                                                {assignedTechnician.phone && (
                                                    <a
                                                        href={`tel:${assignedTechnician.phone}`}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        <span className="hidden sm:inline">{assignedTechnician.phone}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>
                                    {selectedReport.status === 'pending' && (
                                        <button
                                            onClick={(e) => {
                                                handleDeleteClick(e, selectedReport.id);
                                            }}
                                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deletingReportId && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => !isDeleting && setDeletingReportId(null)}
                        />
                        <div className="relative bg-[#1e293b] rounded-2xl border border-red-500/30 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center gap-3 mb-4 text-red-400">
                                <div className="p-2 bg-red-500/10 rounded-full">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Delete Report?</h3>
                            </div>
                            <p className="text-gray-400 mb-4">
                                You are about to delete this report. This action cannot be undone. Please provide a reason for deletion:
                            </p>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Reason for Deletion <span className="text-red-400">*</span></label>
                                <textarea
                                    value={deletionReason}
                                    onChange={(e) => setDeletionReason(e.target.value)}
                                    className="w-full bg-[#020617]/50 border border-white/10 rounded-xl p-3 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none h-24 resize-none placeholder:text-gray-600"
                                    placeholder="I solved it myself, duplicated entry, etc..."
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingReportId(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting || !deletionReason.trim()}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Deleting...
                                        </>
                                    ) : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default function MyReportsClient() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <MyReportsContent />
        </Suspense>
    );
}
