'use client';

import { useState } from 'react';
import { Search, Filter, ChevronRight, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export interface TableReport {
    id: string;
    report_id_display: string;
    category: string;
    address: string;
    priority: string;
    status: string;
    date: string;
}

interface ReportsTableProps {
    reports: TableReport[];
}

export default function ReportsTable({ reports }: ReportsTableProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const statuses = ['All', 'pending', 'in_progress', 'resolved', 'rejected'];

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.report_id_display.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              report.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              report.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            urgent: { color: 'text-red-700', bg: 'bg-red-50', label: 'Urgent' },
            high:   { color: 'text-orange-700', bg: 'bg-orange-50', label: 'High' },
            medium: { color: 'text-yellow-700', bg: 'bg-yellow-50', label: 'Medium' },
            low:    { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Low' },
        };
        return configs[priority] || configs.low;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; bg: string; label: string }> = {
            pending:     { color: 'text-orange-700', bg: 'bg-orange-50', label: 'Pending' },
            in_progress: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'In Progress' },
            resolved:    { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Resolved' },
            rejected:    { color: 'text-red-700', bg: 'bg-red-50', label: 'Rejected' },
        };
        return configs[status] || configs.pending;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            {/* Header & Controls */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Recent Issues</h3>
                    <p className="text-sm text-slate-500 mt-1">Latest reports across jurisdictions</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search ID, category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    
                    <div className="relative w-full sm:w-36">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                        >
                            {statuses.map(s => (
                                <option key={s} value={s}>{s === 'All' ? 'All Status' : s.replace('_', ' ').charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Issue ID</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No reports found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => {
                                const priority = getPriorityConfig(report.priority);
                                const status = getStatusConfig(report.status);

                                return (
                                    <tr 
                                        key={report.id} 
                                        onClick={() => router.push(`/officer/reports/${report.id}`)}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-900">{report.report_id_display}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {report.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate max-w-[200px]">{report.address}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider", priority.bg, priority.color)}>
                                                {priority.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", status.bg, status.color)}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex w-8 h-8 rounded-full bg-slate-50 border border-slate-100 items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
