'use client';

import { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, User, Calendar, AlertTriangle, CheckCircle, Clock, Sparkles, X } from 'lucide-react';
import Toast from '@/components/Toast';

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

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = useAuthStore();
    const router = useRouter();
    const { id } = use(params); // Unwrap the params Promise
    const [report, setReport] = useState<Report | null>(null);
    const [childReports, setChildReports] = useState<Report[]>([]); // Duplicate reports
    const [reportEvidence, setReportEvidence] = useState<any[]>([]); // Evidence from all reporters
    const [consolidatedSummary, setConsolidatedSummary] = useState<string>(''); // AI summary
    const [consolidating, setConsolidating] = useState(false);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [rejecting, setRejecting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // In a real app, we'd have a specific GET endpoint for a single report
            // For now, we'll fetch all and filter, or assume the list endpoint handles basic filtering
            // Let's rely on the dashboard approach but filtered by ID if the API supports it, or just find it
            const [reportsRes, techRes, evidenceRes] = await Promise.all([
                fetch(`/api/reports`), // Ideal: fetch(`/api/reports/${id}`)
                fetch('/api/technicians'),
                fetch(`/api/reports/${id}/evidence`), // Fetch all evidence/submissions
            ]);

            if (reportsRes.ok) {
                const data = await reportsRes.json();
                const foundReport = data.reports.find((r: Report) => r.id === id);
                setReport(foundReport || null);

                // If this report has duplicates, fetch them
                if (foundReport && foundReport.duplicate_count && foundReport.duplicate_count > 0) {
                    const children = data.reports.filter((r: Report) => r.parent_report_id === id);
                    setChildReports(children);
                }
            }

            if (techRes.ok) {
                const data = await techRes.json();
                setTechnicians(data.technicians || []);
            }

            if (evidenceRes.ok) {
                const data = await evidenceRes.json();
                setReportEvidence(data.evidence || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTechnician = async () => {
        if (!report || !selectedTechnicianId) return;

        setAssigning(true);
        try {
            const response = await fetch(`/api/reports/${report.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assigned_technician_id: selectedTechnicianId,
                    assigned_officer_id: user?.id,
                    assigned_at: new Date().toISOString(),
                    assigned_by_name: user?.name,
                    status: 'in_progress',
                }),
            });

            if (response.ok) {
                setToast({ message: 'Technician assigned successfully!', type: 'success' });
                setTimeout(() => router.push('/officer/dashboard'), 1500);
            } else {
                setToast({ message: 'Failed to assign technician', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to assign technician:', error);
            setToast({ message: 'An error occurred', type: 'error' });
        } finally {
            setAssigning(false);
        }
    };

    const handleRejectReport = async () => {
        if (!report || !rejectionReason.trim()) {
            setToast({ message: 'Please provide a rejection reason', type: 'error' });
            return;
        }

        setRejecting(true);
        try {
            const response = await fetch(`/api/reports/${report.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                }),
            });

            if (response.ok) {
                setToast({ message: 'Report rejected successfully', type: 'success' });
                setShowRejectModal(false);
                setTimeout(() => router.push('/officer/dashboard'), 1500);
            } else {
                const data = await response.json();
                setToast({ message: data.error || 'Failed to reject report', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to reject report:', error);
            setToast({ message: 'An error occurred', type: 'error' });
        } finally {
            setRejecting(false);
        }
    };

    const handleConsolidate = async () => {
        if (!report || childReports.length === 0) return;

        setConsolidating(true);
        try {
            const descriptions = [
                {
                    id: report.id,
                    description: report.description,
                    user_name: report.user_name,
                    created_at: report.created_at,
                },
                ...childReports.map(child => ({
                    id: child.id,
                    description: child.description,
                    user_name: child.user_name,
                    created_at: child.created_at,
                })),
            ];

            const response = await fetch('/api/consolidate-descriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descriptions }),
            });

            if (response.ok) {
                const data = await response.json();
                setConsolidatedSummary(data.consolidated);
            } else {
                setToast({ message: 'Failed to generate AI summary', type: 'error' });
            }
        } catch (error) {
            console.error('Consolidation error:', error);
            setToast({ message: 'Error generating summary', type: 'error' });
        } finally {
            setConsolidating(false);
        }
    };

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            urgent: { color: 'text-red-600', bg: 'bg-red-50', label: 'Urgent' },
            high: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High' },
            medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
            low: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Low' },
        };
        return configs[priority] || configs.low;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0f172a]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="p-8 text-center text-white">
                <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const priority = getPriorityConfig(report.priority);
    const availableTechnicians = technicians.filter(t => t.available);

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            Report #{report.id.slice(-6)}
                            <span className={`text-sm px-3 py-1 rounded-full ${priority.bg} ${priority.color}`}>
                                {priority.label}
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Submitted on {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column: Image & Location */}
                    <div className="space-y-6">
                        <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative shadow-sm">
                            {report.image_url ? (
                                <img src={report.image_url} alt="Report" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <MapPin className="w-12 h-12 mb-2" />
                                    <span>No Image Provided</span>
                                </div>
                            )}

                            {(report.duplicate_count || 0) > 0 && (
                                <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    {report.duplicate_count} Duplicate Reports Merged
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                Location Details
                            </h3>
                            <p className="text-slate-600 leading-relaxed mb-4">{report.address}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <span className="block text-xs uppercase tracking-wider mb-1 font-bold text-slate-400">Latitude</span>
                                    <span className="text-slate-700 font-mono">{(report as any).latitude || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider mb-1 font-bold text-slate-400">Longitude</span>
                                    <span className="text-slate-700 font-mono">{(report as any).longitude || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Action */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Current Status</h3>
                                <div className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize
                                    ${report.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                        report.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                                            'bg-emerald-50 text-emerald-600'}
                                `}>
                                    {report.status.replace('_', ' ')}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-bold">Category</label>
                                    <p className="text-slate-800 text-lg capitalize font-medium">{report.category.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-bold">Description</label>
                                    <p className="text-slate-600 leading-relaxed">{report.description}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-bold">Reported By</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                            <User className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <span className="text-slate-700 font-medium">{report.user_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All Reporters Section - Show everyone who reported this issue */}
                        {(reportEvidence.length > 0 || report) && (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    All Reporters ({1 + reportEvidence.length} {reportEvidence.length === 0 ? 'Citizen' : 'Citizens'})
                                </h3>

                                <div className="space-y-4">
                                    {/* Original reporter (parent report) */}
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                                                {report.user_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-white font-bold">{report.user_name}</p>
                                                    <span className="text-xs font-bold uppercase tracking-wide text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                                                        Original Reporter
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-sm mb-2">
                                                    {new Date(report.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                                <p className="text-gray-300 text-sm">{report.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional reporters from evidence */}
                                    {reportEvidence.map((evidence, index) => (
                                        <div key={evidence.id || index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">
                                                    {index + 2}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-white font-bold">Reporter #{index + 2}</p>
                                                        <span className="text-xs font-bold uppercase tracking-wide text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                                                            Additional Report
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-2">
                                                        {new Date(evidence.created_at).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    <p className="text-gray-300 text-sm mb-2">{evidence.description}</p>
                                                    {evidence.image_url && (
                                                        <img
                                                            src={evidence.image_url}
                                                            alt="Evidence"
                                                            className="w-full max-w-xs rounded-lg border border-purple-500/30 mt-2"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <p className="text-xs text-green-400 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        All submissions have been merged into this single report
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Consolidated Descriptions - Show if duplicates exist */}
                        {childReports.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Consolidated Reports ({childReports.length + 1})
                                    </h3>
                                    <button
                                        onClick={handleConsolidate}
                                        disabled={consolidating || !!consolidatedSummary}
                                        className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-bold rounded-lg border border-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {consolidating ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </>
                                        ) : consolidatedSummary ? (
                                            <>
                                                <Sparkles className="w-4 h-4" /> Summary Ready
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" /> AI Summary
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* AI-Generated Summary */}
                                {consolidatedSummary && (
                                    <div className="mb-6 p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-5 h-5 text-purple-600" />
                                            <span className="text-sm font-bold uppercase tracking-wide text-purple-700">
                                                AI-Consolidated Summary
                                            </span>
                                        </div>
                                        <p className="text-slate-800 text-base leading-relaxed font-medium">
                                            {consolidatedSummary}
                                        </p>
                                        <p className="mt-3 text-xs text-purple-600/70 flex items-center gap-1 font-medium">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Analyzed {childReports.length + 1} reports
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {/* Parent report (original) */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wide text-blue-600">Original Report</span>
                                            <span className="text-xs text-slate-400">#{report.id.slice(-6)}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">{report.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                                            <span>By: {report.user_name}</span>
                                            <span>•</span>
                                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Child reports (duplicates) */}
                                    {childReports.map((child, index) => (
                                        <div key={child.id} className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wide text-purple-600">
                                                    Duplicate #{index + 1}
                                                </span>
                                                <span className="text-xs text-slate-400">#{child.id.slice(-6)}</span>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed">{child.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                                                <span>By: {child.user_name}</span>
                                                <span>•</span>
                                                <span>{new Date(child.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Card - Assign Technician */}
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                Take Action
                            </h3>

                            {report.assigned_technician_id ? (
                                <div className="space-y-4">
                                    <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                                        <p className="text-sm text-blue-600 font-bold mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Technician Assigned
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-slate-800 font-bold">
                                                    {technicians.find(t => t.id === report.assigned_technician_id)?.name || 'Unknown Technician'}
                                                </p>
                                                <p className="text-slate-500 text-sm">
                                                    {technicians.find(t => t.id === report.assigned_technician_id)?.specialization || 'Technician'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium ml-1">
                                        This report is actively being handled.
                                    </p>
                                </div>
                            ) : report.status === 'pending' ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">
                                        Assign a technician to investigate and resolve this issue.
                                    </p>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Select Technician</label>
                                        <div className="relative">
                                            <select
                                                value={selectedTechnicianId}
                                                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                                                disabled={assigning}
                                            >
                                                <option value="">Choose a technician...</option>
                                                {availableTechnicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>
                                                        {tech.name} — {tech.specialization} ({tech.area})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAssignTechnician}
                                        disabled={!selectedTechnicianId || assigning}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        {assigning ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Confirm Assignment
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-slate-400 text-center">
                                        Assigning will notify the technician immediately.
                                    </p>

                                    {/* Reject Button */}
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="w-full mt-2 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-100 text-slate-500 hover:text-red-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Reject Report
                                    </button>
                                </div>
                            ) : report.status === 'in_progress' ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">
                                        This report is currently being worked on.
                                    </p>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="w-full bg-white border border-slate-200 hover:bg-red-50 hover:border-red-100 text-slate-500 hover:text-red-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Reject Report
                                    </button>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic font-medium flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    No further action needed.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => !rejecting && setShowRejectModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-8 animate-scale-in">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <X className="w-6 h-6 text-red-500" />
                            Reject Report
                        </h3>
                        <p className="text-slate-500 mb-6 text-sm">
                            Please provide a reason for rejecting this report.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-100 transition-all h-32 resize-none text-sm shadow-inner"
                            placeholder="Reason for rejection..."
                            disabled={rejecting}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                disabled={rejecting}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-transparent text-slate-700 font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectReport}
                                disabled={!rejectionReason.trim() || rejecting}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                            >
                                {rejecting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Rejecting...
                                    </>
                                ) : (
                                    'Confirm Reject'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {
                toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )
            }
        </div >
    );
}
