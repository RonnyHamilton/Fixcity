'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import {
    FileText, Clock, CheckCircle, AlertTriangle, Filter,
    MapPin, ChevronRight, Search, ChevronDown, MoreVertical, UserPlus, Loader2, X, Calendar
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
    const [rejecting, setRejecting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
        setErrorMessage('');
        setSuccessMessage('');

        console.log('[Assignment] Starting technician assignment...');
        console.log('[Assignment] Report ID:', selectedReport.id);
        console.log('[Assignment] Technician ID:', selectedTechnicianId);

        try {
            const response = await fetch(`/api/reports/${selectedReport.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assigned_technician_id: selectedTechnicianId,
                    status: 'in_progress'
                }),
            });

            const data = await response.json();
            console.log('[Assignment] Response status:', response.status);
            console.log('[Assignment] Response data:', data);

            if (response.ok) {
                // Show success message
                const techName = technicians.find(t => t.id === selectedTechnicianId)?.name || 'Technician';
                setSuccessMessage(`✓ Successfully assigned ${techName} to report #${selectedReport.id.slice(-6)}`);

                // Refresh reports to show updated assignment
                await fetchReports();
                setSelectedReport(null);
                setSelectedTechnicianId('');

                // Clear success message after 5 seconds
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                // Handle error response
                const errorMsg = data.error || 'Failed to assign technician';
                console.error('[Assignment] Error:', errorMsg);
                setErrorMessage(errorMsg);
            }
        } catch (error) {
            console.error('[Assignment] Exception:', error);
            setErrorMessage('Network error: Unable to assign technician. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const handleRejectReport = async () => {
        if (!selectedReport || !rejectionReason.trim()) return;

        setRejecting(true);
        try {
            const response = await fetch(`/api/reports/${selectedReport.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                }),
            });

            if (response.ok) {
                // Refresh reports and close modal
                await fetchReports();
                setSelectedReport(null);
                setShowRejectModal(false);
                setRejectionReason('');
            } else {
                console.error('Failed to reject report');
            }
        } catch (error) {
            console.error('Error rejecting report:', error);
        } finally {
            setRejecting(false);
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
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            urgent: { color: 'text-red-600', bg: 'bg-red-50', label: 'Urgent' },
            high: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High' },
            medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
            low: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Low' },
        };
        return configs[priority] || configs.low;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
            pending: { color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock, label: 'Pending' },
            in_progress: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock, label: 'In Progress' },
            resolved: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, label: 'Resolved' },
            rejected: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Rejected' },
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top shadow-sm">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">{successMessage}</p>
                </div>
            )}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="font-medium">{errorMessage}</p>
                    </div>
                    <button
                        onClick={() => setErrorMessage('')}
                        className="text-red-400 hover:text-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">All Reports</h1>
                    <p className="text-slate-500">{reports.length} total reports</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        placeholder="Search by ID, description, location..."
                    />
                </div>

                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto">
                    {['all', 'pending', 'in_progress', 'resolved'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${filter === f
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports Grid (Replaces Table) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[24px] p-16 text-center border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <FileText className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Reports Found</h3>
                        <p className="text-slate-400">
                            {searchQuery ? 'No reports match your search criteria' : 'No reports found with this status'}
                        </p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const priority = getPriorityConfig(report.priority);
                        const status = getStatusConfig(report.status);
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer group flex flex-col h-full"
                            >
                                {/* Header: Status & Date */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${status.color} ${status.bg}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {status.label}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(report.created_at)}
                                    </span>
                                </div>

                                {/* Content: Image & Title */}
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                                        {report.image_url ? (
                                            <img src={report.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <MapPin className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{report.category.replace('_', ' ')}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2">{report.description}</p>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4 mt-auto">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{report.address}</span>
                                </div>

                                {/* Footer: Priority & Action */}
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${priority.color} ${priority.bg}`}>
                                        {priority.label}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                    onClick={() => setSelectedReport(null)}
                >
                    <div
                        className="bg-[#F7F8FA] rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Report Details</h2>
                                <p className="text-sm text-slate-500">ID: #{selectedReport.id.slice(-6)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)] space-y-8">
                            {/* Image & Status Hybrid */}
                            <div className="flex flex-col sm:flex-row gap-6">
                                {selectedReport.image_url && (
                                    <div className="w-full sm:w-1/2 rounded-2xl overflow-hidden shadow-sm aspect-video sm:aspect-square relative group">
                                        <img
                                            src={selectedReport.image_url}
                                            alt="Report"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 space-y-4">
                                    {/* Status Card */}
                                    <div className={`p-4 rounded-xl border ${selectedReport.status === 'resolved' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Status</label>
                                        <div className="flex items-center gap-2">
                                            {React.createElement(getStatusConfig(selectedReport.status).icon, { className: `w-5 h-5 ${getStatusConfig(selectedReport.status).color.replace('text-', 'text-')}` })}
                                            <span className={`font-bold ${getStatusConfig(selectedReport.status).color}`}>{getStatusConfig(selectedReport.status).label}</span>
                                        </div>
                                    </div>

                                    {/* Priority Card */}
                                    <div className="p-4 rounded-xl bg-white border border-slate-100">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Priority</label>
                                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold uppercase ${getPriorityConfig(selectedReport.priority).bg} ${getPriorityConfig(selectedReport.priority).color}`}>
                                            {selectedReport.priority}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
                                    <p className="text-slate-800 text-lg font-medium capitalize">{selectedReport.category.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Reported By</label>
                                    <p className="text-slate-800 text-lg font-medium">{selectedReport.user_name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Description</label>
                                    <p className="text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100">
                                        {selectedReport.description}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Location</label>
                                    <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-100">
                                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-slate-700">{selectedReport.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Resolution Notes */}
                            {selectedReport.status === 'resolved' && selectedReport.resolution_notes && (() => {
                                const { text, imageUrl } = parseResolutionNotes(selectedReport.resolution_notes);
                                return (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                                            <h3 className="font-bold text-emerald-900">Resolution Details</h3>
                                        </div>
                                        {text && <p className="text-emerald-800 leading-relaxed">{text}</p>}
                                        {imageUrl && (
                                            <div>
                                                <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Proof of Completion</label>
                                                <div className="rounded-xl overflow-hidden shadow-sm">
                                                    <img
                                                        src={imageUrl}
                                                        alt="Resolution proof"
                                                        className="w-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer - Actions */}
                        <div className="bg-white p-6 border-t border-slate-100 sticky bottom-0 z-10">
                            {selectedReport.status === 'pending' || !selectedReport.assigned_technician_id ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <select
                                            value={selectedTechnicianId}
                                            onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                            className="w-full h-14 pl-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none transition-all cursor-pointer"
                                        >
                                            <option value="">Select a technician for assignment...</option>
                                            {technicians.filter(t => t.available).map(tech => (
                                                <option key={tech.id} value={tech.id}>
                                                    {tech.name} — {tech.specialization} ({tech.area})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedReport(null)}
                                            className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAssignTechnician}
                                            disabled={!selectedTechnicianId || assigning}
                                            className="flex-[2] py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                        >
                                            {assigning ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Assigning...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    Confirm Assignment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-900">Technician Assigned</p>
                                            <p className="text-xs text-emerald-700">This report is currently being handled.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedReport(null)}
                                            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                                        >
                                            Close Details
                                        </button>
                                        {selectedReport.status === 'in_progress' && (
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                className="flex-1 py-3 rounded-xl bg-white border-2 border-slate-100 hover:bg-red-50 hover:border-red-100 text-slate-600 hover:text-red-600 font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Reject Report
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && selectedReport && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !rejecting && setShowRejectModal(false)}
                    />
                    <div className="relative bg-white rounded-[24px] shadow-2xl max-w-md w-full p-8 animate-scale-in">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            Reject Report
                        </h3>
                        <p className="text-slate-500 mb-6 text-sm">
                            Please provide a clear reason for rejecting this report. This information will be sent to the citizen.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors h-32 resize-none text-sm"
                            placeholder="Reason for rejection (e.g. Report is outside jurisdiction)..."
                            disabled={rejecting}
                        />
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                disabled={rejecting}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectReport}
                                disabled={!rejectionReason.trim() || rejecting}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
