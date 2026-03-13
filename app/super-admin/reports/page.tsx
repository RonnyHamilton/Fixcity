'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    FileText, Clock, CheckCircle, AlertTriangle, Search, MapPin,
    ChevronDown, ChevronRight, Calendar, X, Building2, Shield
} from 'lucide-react';

interface Report {
    id: string;
    user_name: string;
    category: string;
    description: string;
    image_url: string;
    address: string;
    ward_id?: string;
    ward_name?: string;
    taluk_name?: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
}

interface WardGroup {
    ward_name: string;
    ward_id: string;
    reports: Report[];
}

interface TalukGroup {
    taluk_name: string;
    wards: WardGroup[];
    totalReports: number;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dotColor: string }> = {
    pending: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Pending', dotColor: 'bg-orange-500' },
    in_progress: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'In Progress', dotColor: 'bg-blue-500' },
    resolved: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Resolved', dotColor: 'bg-emerald-500' },
    rejected: { color: 'text-red-700', bg: 'bg-red-100', label: 'Rejected', dotColor: 'bg-red-500' },
    closed: { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Closed', dotColor: 'bg-slate-400' },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
    urgent: { color: 'text-red-700', bg: 'bg-red-50' },
    high: { color: 'text-orange-700', bg: 'bg-orange-50' },
    medium: { color: 'text-yellow-700', bg: 'bg-yellow-50' },
    low: { color: 'text-slate-600', bg: 'bg-slate-100' },
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function SuperAdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [expandedTaluks, setExpandedTaluks] = useState<Set<string>>(new Set());
    const [expandedWards, setExpandedWards] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { supabase } = await import('@/lib/supabase');

            // Fetch reports joined with ward and taluk info
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    id, user_name, category, description, image_url, address,
                    status, priority, created_at, ward_id,
                    wards:ward_id (
                        name,
                        taluks:taluk_id (
                            name
                        )
                    )
                `)
                .is('parent_report_id', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const enriched = (data || []).map((r: any) => ({
                ...r,
                ward_name: r.wards?.name || 'Unassigned',
                taluk_name: r.wards?.taluks?.name || 'Unassigned',
            }));

            setReports(enriched);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group filtered reports by taluk → ward
    const grouped = useMemo<TalukGroup[]>(() => {
        let filtered = reports;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.description?.toLowerCase().includes(q) ||
                r.address?.toLowerCase().includes(q) ||
                r.category?.toLowerCase().includes(q) ||
                r.ward_name?.toLowerCase().includes(q) ||
                r.taluk_name?.toLowerCase().includes(q) ||
                r.id.toLowerCase().includes(q)
            );
        }

        const talukMap: Record<string, Record<string, Report[]>> = {};
        for (const report of filtered) {
            const taluk = report.taluk_name || 'Unassigned';
            const ward = report.ward_name || 'Unassigned';
            if (!talukMap[taluk]) talukMap[taluk] = {};
            if (!talukMap[taluk][ward]) talukMap[taluk][ward] = [];
            talukMap[taluk][ward].push(report);
        }

        return Object.entries(talukMap).map(([taluk_name, wardMap]) => {
            const wards = Object.entries(wardMap).map(([ward_name, reps]) => ({
                ward_name,
                ward_id: reps[0]?.ward_id || ward_name,
                reports: reps,
            }));
            return {
                taluk_name,
                wards,
                totalReports: wards.reduce((s, w) => s + w.reports.length, 0),
            };
        }).sort((a, b) => a.taluk_name.localeCompare(b.taluk_name));
    }, [reports, statusFilter, searchQuery]);

    const totalFiltered = grouped.reduce((s, t) => s + t.totalReports, 0);

    const toggleTaluk = (name: string) => {
        setExpandedTaluks(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };
    const toggleWard = (key: string) => {
        setExpandedWards(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };
    const expandAll = () => {
        setExpandedTaluks(new Set(grouped.map(g => g.taluk_name)));
        const wardKeys = grouped.flatMap(g => g.wards.map(w => `${g.taluk_name}::${w.ward_name}`));
        setExpandedWards(new Set(wardKeys));
    };
    const collapseAll = () => {
        setExpandedTaluks(new Set());
        setExpandedWards(new Set());
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="w-7 h-7 text-amber-500" />
                        All Reports
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {totalFiltered} report{totalFiltered !== 1 ? 's' : ''} across {grouped.length} taluk{grouped.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={expandAll} className="px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-amber-500/40 hover:bg-amber-50 hover:text-amber-700 transition-all shadow-sm">
                        Expand All
                    </button>
                    <button onClick={collapseAll} className="px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        placeholder="Search by category, address, taluk, ward..."
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {['all', 'pending', 'in_progress', 'resolved', 'rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === s
                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                                }`}
                        >
                            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grouped Accordion */}
            {grouped.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Reports Found</h3>
                    <p className="text-slate-500">{searchQuery || statusFilter !== 'all' ? 'No reports match your filter criteria.' : 'No reports have been submitted yet.'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {grouped.map((taluk) => {
                        const talukExpanded = expandedTaluks.has(taluk.taluk_name);
                        const talukTotal = taluk.totalReports;
                        const pendingCount = taluk.wards.flatMap(w => w.reports).filter(r => r.status === 'pending').length;
                        return (
                            <div key={taluk.taluk_name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Taluk Header */}
                                <button
                                    onClick={() => toggleTaluk(taluk.taluk_name)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                                {taluk.taluk_name}
                                            </h2>
                                            <p className="text-sm text-slate-500">
                                                {taluk.wards.length} ward{taluk.wards.length !== 1 ? 's' : ''} · {talukTotal} report{talukTotal !== 1 ? 's' : ''}
                                                {pendingCount > 0 && (
                                                    <span className="ml-2 text-orange-600 font-semibold">{pendingCount} pending</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${talukExpanded ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Wards under this Taluk */}
                                {talukExpanded && (
                                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                                        {taluk.wards.map((ward) => {
                                            const wardKey = `${taluk.taluk_name}::${ward.ward_name}`;
                                            const wardExpanded = expandedWards.has(wardKey);
                                            const wardPending = ward.reports.filter(r => r.status === 'pending').length;
                                            return (
                                                <div key={ward.ward_name}>
                                                    {/* Ward Header */}
                                                    <button
                                                        onClick={() => toggleWard(wardKey)}
                                                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center ml-2">
                                                                <Shield className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                                                                    {ward.ward_name}
                                                                </span>
                                                                <span className="ml-2 text-sm text-slate-400">
                                                                    {ward.reports.length} report{ward.reports.length !== 1 ? 's' : ''}
                                                                    {wardPending > 0 && (
                                                                        <span className="ml-2 text-orange-600 font-medium">{wardPending} pending</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${wardExpanded ? 'rotate-90' : ''}`} />
                                                    </button>

                                                    {/* Reports in this Ward */}
                                                    {wardExpanded && (
                                                        <div className="bg-slate-50/60 px-5 pb-4 pt-2 space-y-3">
                                                            {ward.reports.map((report) => {
                                                                const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                                                                const priority = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.low;
                                                                return (
                                                                    <div
                                                                        key={report.id}
                                                                        onClick={() => setSelectedReport(report)}
                                                                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
                                                                    >
                                                                        {/* Image */}
                                                                        <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                                                            {report.image_url ? (
                                                                                <img src={report.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                                    <MapPin className="w-6 h-6" />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Details */}
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                                <h4 className="font-bold text-slate-800 capitalize truncate">
                                                                                    {report.category.replace(/_/g, ' ')}
                                                                                </h4>
                                                                                <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${status.color} ${status.bg}`}>
                                                                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
                                                                                    {status.label}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm text-slate-500 line-clamp-1 mb-2">{report.description}</p>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                                    <span className="truncate max-w-[200px]">{report.address}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${priority.color} ${priority.bg}`}>
                                                                                        {report.priority}
                                                                                    </span>
                                                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        {formatDate(report.created_at)}
                                                                                    </span>
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
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Report Detail Modal */}
            {selectedReport && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedReport(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Report Details</h2>
                                <p className="text-sm text-slate-500">ID #{selectedReport.id.slice(-6)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {selectedReport.image_url && (
                                <div className="rounded-xl overflow-hidden aspect-video">
                                    <img src={selectedReport.image_url} alt="Report" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${STATUS_CONFIG[selectedReport.status]?.color}`}>
                                        <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[selectedReport.status]?.dotColor}`}></span>
                                        {STATUS_CONFIG[selectedReport.status]?.label}
                                    </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                                    <span className={`inline-block text-sm font-bold uppercase ${PRIORITY_CONFIG[selectedReport.priority]?.color}`}>
                                        {selectedReport.priority}
                                    </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Taluk</label>
                                    <span className="text-sm font-semibold text-slate-700">{selectedReport.taluk_name || '—'}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ward</label>
                                    <span className="text-sm font-semibold text-slate-700">{selectedReport.ward_name || '—'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
                                <p className="text-slate-800 font-semibold capitalize">{selectedReport.category.replace(/_/g, ' ')}</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Description</label>
                                <p className="text-slate-600 bg-slate-50 rounded-xl p-4 text-sm leading-relaxed">{selectedReport.description}</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Location</label>
                                <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-4">
                                    <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-slate-700 text-sm">{selectedReport.address}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Reported By</label>
                                <p className="text-slate-800 font-semibold">{selectedReport.user_name}</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Submitted</label>
                                <span className="flex items-center gap-2 text-slate-600 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(selectedReport.created_at)}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
