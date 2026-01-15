'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import {
    FileText, Clock, CheckCircle, AlertTriangle, Filter,
    MapPin, ChevronRight, Search, ChevronDown, MoreVertical, UserPlus, Loader2
} from 'lucide-react';
import { parseResolutionNotes } from '@/lib/resolution-utils';

interface Report {
    id: string;
    user_name: string;
    category: string;
    description: string;
    image_url: string;
    address: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_technician_id?: string;
    resolution_notes?: string;
    created_at: string;
}

interface Technician {
    id: string;
    name: string;
    specialization: string;
    area: string;
    available: boolean;
}

export default function OfficerReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchReports();
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            const response = await fetch('/api/technicians');
            if (response.ok) {
                const data = await response.json();
                setTechnicians(data.technicians || []);
            }
        } catch (error) {
            console.error('Failed to fetch technicians:', error);
        }
    };

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/reports');
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

    const handleAssignTechnician = async () => {
        if (!selectedTechnicianId || !selectedReport) return;

        setAssigning(true);
        try {
            const response = await fetch(`/api/reports/${selectedReport.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assigned_technician_id: selectedTechnicianId,
                    status: 'in_progress'
                }),
            });

            if (response.ok) {
                // Refresh reports to show updated assignment
                await fetchReports();
                setSelectedReport(null);
                setSelectedTechnicianId('');
            }
        } catch (error) {
            console.error('Failed to assign technician:', error);
        } finally {
            setAssigning(false);
        }
    };

    // Filter reports
    let filteredReports = reports;

    if (filter !== 'all') {
        filteredReports = filteredReports.filter(r => r.status === filter);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredReports = filteredReports.filter(r =>
            r.description.toLowerCase().includes(query) ||
            r.address.toLowerCase().includes(query) ||
            r.category.toLowerCase().includes(query) ||
            r.id.toLowerCase().includes(query)
        );
    }

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string }> = {
            urgent: { color: 'text-red-400', bg: 'bg-red-500/20' },
            high: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
            medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
            low: { color: 'text-gray-400', bg: 'bg-gray-500/20' },
        };
        return configs[priority] || configs.low;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
            pending: { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Clock, label: 'Pending' },
            in_progress: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Clock, label: 'In Progress' },
            resolved: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle, label: 'Resolved' },
            rejected: { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle, label: 'Rejected' },
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">All Reports</h1>
                    <p className="text-gray-400">{reports.length} total reports</p>
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
                        className="w-full h-11 pl-12 pr-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Search by ID, description, location..."
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'in_progress', 'resolved'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Report</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Category</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Priority</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
                                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredReports.map((report) => {
                                const priority = getPriorityConfig(report.priority);
                                const status = getStatusConfig(report.status);
                                const StatusIcon = status.icon;

                                return (
                                    <tr
                                        key={report.id}
                                        onClick={() => setSelectedReport(report)}
                                        className="hover:bg-white/[0.02] transition-all cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                                    {report.image_url ? (
                                                        <img src={report.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium text-sm truncate max-w-[200px]">{report.description}</p>
                                                    <p className="text-gray-500 text-xs">#{report.id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-300">{report.category.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${status.color} ${status.bg}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${priority.color} ${priority.bg}`}>
                                                {report.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-400">{formatDate(report.created_at)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedReport(report);
                                                }}
                                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredReports.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
                        <p className="text-gray-400">
                            {searchQuery ? 'No reports match your search' : 'No reports with this status'}
                        </p>
                    </div>
                )}
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    onClick={() => setSelectedReport(null)}
                >
                    <div
                        className="bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#1e293b]/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Report Details</h2>
                                <p className="text-sm text-gray-400">ID: #{selectedReport.id.slice(-6)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Image */}
                            {selectedReport.image_url && (
                                <div className="rounded-xl overflow-hidden border border-white/10">
                                    <img
                                        src={selectedReport.image_url}
                                        alt="Report"
                                        className="w-full h-64 object-cover"
                                    />
                                </div>
                            )}

                            {/* Status and Priority */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Status</label>
                                    <span className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${getStatusConfig(selectedReport.status).color} ${getStatusConfig(selectedReport.status).bg} w-full`}>
                                        {React.createElement(getStatusConfig(selectedReport.status).icon, { className: "w-4 h-4" })}
                                        {getStatusConfig(selectedReport.status).label}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Priority</label>
                                    <span className={`inline-flex items-center justify-center text-sm font-bold px-3 py-2 rounded-lg ${getPriorityConfig(selectedReport.priority).color} ${getPriorityConfig(selectedReport.priority).bg} w-full uppercase`}>
                                        {selectedReport.priority}
                                    </span>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Category</label>
                                <p className="text-white text-base capitalize">{selectedReport.category.replace('_', ' ')}</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Description</label>
                                <p className="text-white text-base leading-relaxed">{selectedReport.description}</p>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Location</label>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                    <p className="text-white text-base">{selectedReport.address}</p>
                                </div>
                            </div>

                            {/* Reporter Info */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Reported By</label>
                                <p className="text-white text-base">{selectedReport.user_name}</p>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Date Reported</label>
                                <p className="text-white text-base">{formatDate(selectedReport.created_at)}</p>
                            </div>

                            {/* Resolution Notes */}
                            {selectedReport.status === 'resolved' && selectedReport.resolution_notes && (() => {
                                const { text, imageUrl } = parseResolutionNotes(selectedReport.resolution_notes);
                                return (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 block">Resolution Notes</label>
                                                {text && <p className="text-white text-base">{text}</p>}
                                            </div>
                                        </div>
                                        {imageUrl && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Proof of Completion</label>
                                                <img
                                                    src={imageUrl}
                                                    alt="Resolution proof"
                                                    className="w-full rounded-lg border border-green-500/30"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer - Technician Assignment */}
                        <div className="sticky bottom-0 bg-[#1e293b]/95 backdrop-blur-xl border-t border-white/10 p-6 space-y-4">
                            {selectedReport.status === 'pending' || !selectedReport.assigned_technician_id ? (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">
                                            Assign Technician
                                        </label>
                                        <select
                                            value={selectedTechnicianId}
                                            onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white px-4 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        >
                                            <option value="" className="bg-slate-800">Select a technician...</option>
                                            {technicians.filter(t => t.available).map(tech => (
                                                <option key={tech.id} value={tech.id} className="bg-slate-800">
                                                    {tech.name} - {tech.specialization} ({tech.area})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedReport(null)}
                                            className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={handleAssignTechnician}
                                            disabled={!selectedTechnicianId || assigning}
                                            className="flex-1 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {assigning ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Assigning...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    Assign Technician
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                        <p className="text-sm text-green-400 font-medium">
                                            ✓ Technician already assigned to this report
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="w-full px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
                                    >
                                        Close
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
