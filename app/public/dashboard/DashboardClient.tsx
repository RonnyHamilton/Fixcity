'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, CheckCircle, Clock, AlertCircle, Plus, TrendingUp, Eye, X, MapPin, Calendar, Tag, Trash2, Phone, BadgeCheck } from 'lucide-react';
import { parseResolutionNotes } from '@/lib/resolution-utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { translations } from '@/lib/translations';

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

interface PublicUser {
    id: string;
    email: string;
    name: string;
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';
    const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [mounted, setMounted] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    // Delete state
    const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
    const [deletionReason, setDeletionReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    // Technician details state
    const [assignedTechnician, setAssignedTechnician] = useState<any>(null);

    // Language support
    const { language } = useAuthStore();
    const t = (key: string) => (translations[language] as any)?.[key] || (translations.en as any)[key] || key;

    // Auth guard - check UID from URL and fetch user from DB
    useEffect(() => {
        const uid = searchParams.get('uid');

        console.log('=== DASHBOARD AUTH CHECK ===');
        console.log('UID from URL:', uid);

        // Guard #1: No UID → redirect to login
        if (!uid) {
            console.log('Guard #1: No UID found, redirecting to login');
            window.location.href = '/login/public';
            return;
        }

        const fetchUser = async () => {
            console.log('Fetching user with ID:', uid);
            const { data: user, error } = await supabase
                .from('public_users')
                .select('id, name, email')
                .eq('id', uid)
                .single();

            console.log('Fetch result:', { user, error });

            // Guard #2: Invalid UID → redirect to login
            if (error || !user) {
                console.log('Guard #2: User not found or error, redirecting to login');
                console.log('Error details:', error);
                window.location.href = '/login/public';
                return;
            }

            // Success - set user
            console.log('Auth success! User:', user);
            setCurrentUser(user);
            setAuthChecked(true);
            setMounted(true);
        };

        fetchUser();
    }, []);

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
        if (mounted && authChecked && currentUser?.id) {
            fetchUserReports();
        }
    }, [currentUser?.id, mounted, authChecked]);

    if (!mounted || !authChecked) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const fetchUserReports = async () => {
        try {
            // Fetch only reports from this user
            const response = await fetch(`/api/reports?userId=${currentUser?.id}`);
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

    // Calculate stats from user's reports only
    const stats = {
        total: reports.length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        pending: reports.filter(r => r.status === 'pending').length,
    };

    const getStatusBadge = (status: Report['status']) => {
        const badges = {
            pending: { color: 'bg-amber-500', lightBg: 'bg-amber-50', lightText: 'text-amber-700', text: 'Pending Review', icon: Clock },
            in_progress: { color: 'bg-blue-500', lightBg: 'bg-blue-50', lightText: 'text-blue-700', text: 'In Progress', icon: TrendingUp },
            resolved: { color: 'bg-green-500', lightBg: 'bg-green-50', lightText: 'text-green-700', text: 'Resolved', icon: CheckCircle },
            rejected: { color: 'bg-red-500', lightBg: 'bg-red-50', lightText: 'text-red-700', text: 'Rejected', icon: AlertCircle },
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
        if (days === 0) return t('today');
        if (days === 1) return t('yesterday');
        if (days < 7) return `${days} ${t('daysAgo')}`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="w-full">
            {/* Welcome Banner */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 py-4">
                <div>
                    <h1 className="text-slate-800 text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">
                        {t('welcomeBack')} <span className="text-blue-600">{currentUser?.name || 'User'}</span>
                    </h1>
                    <p className="text-slate-500 text-lg">
                        {t('trackContributions')}
                    </p>
                </div>
                <Link
                    href={`/public/report?uid=${searchParams.get('uid')}`}
                    className="flex items-center justify-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-sm font-bold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    {t('reportNewIssue')}
                </Link>
            </div>

            {/* Stats Cards */}
            {reports.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">{t('totalReports')}</p>
                        </div>
                        <p className="text-slate-800 text-4xl font-black">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-green-50 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">{t('resolved')}</p>
                        </div>
                        <p className="text-slate-800 text-4xl font-black">{stats.resolved}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">{t('inProgress')}</p>
                        </div>
                        <p className="text-slate-800 text-4xl font-black">{stats.inProgress}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">{t('pending')}</p>
                        </div>
                        <p className="text-slate-800 text-4xl font-black">{stats.pending}</p>
                    </div>
                </div>
            )}

            {/* Reports List */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : reports.length === 0 ? (
                /* Empty State */
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">{t('noReportsYet')}</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                        {t('noReportsDescription')}
                    </p>
                    <Link
                        href={`/public/report?uid=${searchParams.get('uid')}`}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        {t('reportFirstIssue')}
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
                                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-shadow flex flex-col group relative h-full"
                            >
                                {/* Delete Button */}
                                {report.status === 'pending' && (
                                    <button
                                        onClick={(e) => handleDeleteClick(e, report.id)}
                                        className="absolute top-3 right-3 z-20 p-2.5 rounded-full bg-white/90 hover:bg-red-500 text-slate-400 hover:text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg border border-slate-100"
                                        title="Delete Report"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Image */}
                                <div className="relative h-48 bg-slate-100 overflow-hidden">
                                    {report.image_url ? (
                                        <img
                                            src={report.image_url}
                                            alt={report.category}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                            <span className="material-symbols-outlined text-6xl text-slate-300">
                                                {getCategoryIcon(report.category)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className={`absolute top-3 left-3 ${statusBadge.lightBg} backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-slate-100/50 flex items-center gap-2 ${statusBadge.lightText}`}>
                                        <span className={`w-2 h-2 rounded-full ${statusBadge.color} ${report.status === 'in_progress' ? 'animate-pulse' : ''}`} />
                                        {statusBadge.text}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 bg-blue-50 inline-block px-2 py-1 rounded-md">
                                                {report.category.replace('_', ' ')}
                                            </div>
                                            <h3 className="text-base font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                                                {report.description}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3 bg-slate-50 p-2 rounded-lg">
                                        <span className="whitespace-nowrap">{formatRelativeDate(report.created_at)}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="truncate">{report.address}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 h-10">{report.description}</p>

                                    {/* View Details Button */}
                                    <div className="mt-auto pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 text-slate-600 text-sm font-bold py-3 rounded-xl transition-all group/btn"
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
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedReport(null)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image */}
                        {selectedReport.image_url && (
                            <div className="relative h-64 bg-slate-100">
                                <img
                                    src={selectedReport.image_url}
                                    alt={selectedReport.category}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6 md:p-8">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                                            {selectedReport.category.replace('_', ' ')}
                                        </span>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${getPriorityBadge(selectedReport.priority).color} text-white`}>
                                            {getPriorityBadge(selectedReport.priority).text} Priority
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">Report Details</h2>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${getStatusBadge(selectedReport.status).color} text-white shadow-lg`}>
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    {getStatusBadge(selectedReport.status).text}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-4">
                                {/* Description */}
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-slate-700 text-base leading-relaxed">{selectedReport.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                            <p className="text-slate-700 mb-1">{selectedReport.address}</p>
                                            {selectedReport.latitude && selectedReport.longitude && (
                                                <p className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                                                    {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reported</p>
                                            <p className="text-slate-700 font-medium text-sm">{formatDate(selectedReport.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID</p>
                                            <p className="text-slate-700 font-mono text-sm">{selectedReport.id}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Resolution Notes */}
                                {selectedReport.status === 'resolved' && selectedReport.resolution_notes && (() => {
                                    const { text, imageUrl } = parseResolutionNotes(selectedReport.resolution_notes);
                                    return (
                                        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Resolution Notes</p>
                                                    {text && <p className="text-slate-700">{text}</p>}
                                                </div>
                                            </div>
                                            {imageUrl && (
                                                <img
                                                    src={imageUrl}
                                                    alt="Resolution proof"
                                                    className="w-full rounded-lg border border-green-200"
                                                />
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Technician Contact Card */}
                                {assignedTechnician && (selectedReport.status === 'in_progress' || selectedReport.status === 'resolved') && (
                                    <div className="mt-4 p-1 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100">
                                        <div className="bg-white rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <BadgeCheck className="w-5 h-5 text-blue-600" />
                                                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Assigned Technician</h3>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                                        {assignedTechnician.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-800 font-bold text-lg">{assignedTechnician.name}</p>
                                                        <p className="text-xs text-slate-500">ID: {assignedTechnician.badge_id}</p>
                                                    </div>
                                                </div>
                                                {assignedTechnician.phone && (
                                                    <a
                                                        href={`tel:${assignedTechnician.phone}`}
                                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
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
                            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                                {selectedReport.status === 'pending' && (
                                    <button
                                        onClick={(e) => {
                                            handleDeleteClick(e, selectedReport.id);
                                        }}
                                        className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => !isDeleting && setDeletingReportId(null)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-50 rounded-xl">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Delete Report?</h3>
                                <p className="text-xs text-slate-500 font-mono mt-1">ID: {deletingReportId}</p>
                            </div>
                        </div>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            This action cannot be undone. To verify this deletion, please provide a reason below.
                        </p>
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Reason for Deletion</label>
                            <textarea
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none h-32 resize-none placeholder:text-slate-400"
                                placeholder="E.g., duplicate report, issue resolved, etc..."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeletingReportId(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting || !deletionReason.trim()}
                                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>Delete Forever</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DashboardClient() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
