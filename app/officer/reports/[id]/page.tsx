'use client';

import { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, User, Calendar, AlertTriangle, CheckCircle, Clock, Sparkles } from 'lucide-react';
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
    const [consolidatedSummary, setConsolidatedSummary] = useState<string>(''); // AI summary
    const [consolidating, setConsolidating] = useState(false);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // In a real app, we'd have a specific GET endpoint for a single report
            // For now, we'll fetch all and filter, or assume the list endpoint handles basic filtering
            // Let's rely on the dashboard approach but filtered by ID if the API supports it, or just find it
            const [reportsRes, techRes] = await Promise.all([
                fetch(`/api/reports`), // Ideal: fetch(`/api/reports/${id}`)
                fetch('/api/technicians'),
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
            urgent: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgent' },
            high: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
            medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Medium' },
            low: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Low' },
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
        <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            Report #{report.id.slice(-6)}
                            <span className={`text-sm px-3 py-1 rounded-full ${priority.bg} ${priority.color}`}>
                                {priority.label}
                            </span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Submitted on {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column: Image & Location */}
                    <div className="space-y-6">
                        <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden border border-white/10 relative">
                            {report.image_url ? (
                                <img src={report.image_url} alt="Report" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <MapPin className="w-12 h-12 mb-2" />
                                    <span>No Image Provided</span>
                                </div>
                            )}

                            {(report.duplicate_count || 0) > 0 && (
                                <div className="absolute top-4 right-4 bg-purple-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    {report.duplicate_count} Duplicate Reports Merged
                                </div>
                            )}
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Location Details
                            </h3>
                            <p className="text-gray-300 leading-relaxed mb-4">{report.address}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 bg-black/20 p-4 rounded-lg">
                                <div>
                                    <span className="block text-xs uppercase tracking-wider mb-1">Latitude</span>
                                    <span className="text-white font-mono">{(report as any).latitude || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider mb-1">Longitude</span>
                                    <span className="text-white font-mono">{(report as any).longitude || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Action */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Current Status</h3>
                                <div className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize
                                    ${report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                                        report.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-green-500/20 text-green-400'}
                                `}>
                                    {report.status.replace('_', ' ')}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Category</label>
                                    <p className="text-white text-lg capitalize">{report.category.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                                    <p className="text-gray-300">{report.description}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Reported By</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                            <User className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-white">{report.user_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Consolidated Descriptions - Show if duplicates exist */}
                        {childReports.length > 0 && (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Consolidated Reports ({childReports.length + 1} total)
                                    </h3>
                                    <button
                                        onClick={handleConsolidate}
                                        disabled={consolidating || !!consolidatedSummary}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {consolidating ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating AI Summary...
                                            </>
                                        ) : consolidatedSummary ? (
                                            <>
                                                <Sparkles className="w-4 h-4" /> AI Summary Generated
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" /> Generate AI Summary
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* AI-Generated Summary */}
                                {consolidatedSummary && (
                                    <div className="mb-4 p-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-xl">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                            <span className="text-sm font-bold uppercase tracking-wide text-purple-400">
                                                AI-Consolidated Summary
                                            </span>
                                        </div>
                                        <p className="text-white text-base leading-relaxed font-medium">
                                            {consolidatedSummary}
                                        </p>
                                        <p className="mt-3 text-xs text-purple-300/70 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Powered by Gemini AI • Analyzing {childReports.length + 1} reports
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {/* Parent report (original) */}
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wide text-blue-400">Original Report</span>
                                            <span className="text-xs text-gray-500">#{report.id.slice(-6)}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{report.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>By: {report.user_name}</span>
                                            <span>•</span>
                                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Child reports (duplicates) */}
                                    {childReports.map((child, index) => (
                                        <div key={child.id} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wide text-purple-400">
                                                    Duplicate Report #{index + 1}
                                                </span>
                                                <span className="text-xs text-gray-500">#{child.id.slice(-6)}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed">{child.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>By: {child.user_name}</span>
                                                <span>•</span>
                                                <span>{new Date(child.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <p className="text-xs text-green-400 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        These reports were automatically merged based on location and category
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Card - Assign Technician */}
                        <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-primary" />
                                Take Action
                            </h3>

                            {report.assigned_technician_id ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                        <p className="text-sm text-blue-400 mb-2 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Technician Already Assigned
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {technicians.find(t => t.id === report.assigned_technician_id)?.name || 'Unknown Technician'}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    {technicians.find(t => t.id === report.assigned_technician_id)?.specialization || 'Technician'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        This report is currently being handled by the assigned technician.
                                    </p>
                                </div>
                            ) : report.status === 'pending' ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-300">
                                        Assign a technician to investigate and resolve this issue.
                                    </p>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white">Select Technician</label>
                                        <select
                                            value={selectedTechnicianId}
                                            onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                            className="w-full bg-[#0f172a] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                            disabled={assigning}
                                        >
                                            <option value="">Choose a technician...</option>
                                            {availableTechnicians.map(tech => (
                                                <option key={tech.id} value={tech.id}>
                                                    {tech.name} — {tech.specialization} ({tech.area})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAssignTechnician}
                                        disabled={!selectedTechnicianId || assigning}
                                        className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {assigning ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Assign Technician
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-500">
                                        * Assigning will change status to "In Progress" and notify the technician.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-400 italic">
                                    This report is {report.status.replace('_', ' ')}. No assignment needed.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
