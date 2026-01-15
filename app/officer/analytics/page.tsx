'use client';

import { useEffect, useState } from 'react';
import {
    BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle,
    Calendar, ChevronDown, FileText, Users, MapPin, Activity
} from 'lucide-react';

interface Report {
    id: string;
    user_id: string;
    user_name: string;
    category: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    updated_at?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
}

export default function OfficerAnalyticsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7days');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/reports');
            if (response.ok) {
                const data = await response.json();
                // Filter out duplicates - only count canonical reports
                const canonicalReports = (data.reports || []).filter((r: any) => !r.parent_report_id);
                setReports(canonicalReports);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        urgent: reports.filter(r => r.priority === 'urgent').length,
    };

    // Calculate category distribution
    const categoryStats = reports.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Resolution rate
    const resolutionRate = stats.total > 0
        ? Math.round((stats.resolved / stats.total) * 100)
        : 0;

    // Calculate Avg Response Time (time from creation to resolution)
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.updated_at);
    const avgResponseTimeHours = resolvedReports.length > 0
        ? resolvedReports.reduce((acc, r) => {
            const created = new Date(r.created_at).getTime();
            const resolved = new Date(r.updated_at!).getTime();
            const hours = (resolved - created) / (1000 * 60 * 60);
            return acc + hours;
        }, 0) / resolvedReports.length
        : 0;

    const avgResponseTime = avgResponseTimeHours < 1
        ? `${Math.round(avgResponseTimeHours * 60)}m`
        : avgResponseTimeHours < 24
            ? `${Math.round(avgResponseTimeHours)}h`
            : `${Math.round(avgResponseTimeHours / 24)}d`;

    // Calculate Active Citizens (unique users who reported)
    const uniqueUsers = new Set(reports.map(r => r.user_id)).size;

    // Calculate Areas Covered (unique locations/addresses)
    const uniqueAreas = new Set(
        reports
            .filter(r => r.address)
            .map(r => {
                // Simplify address to area level (e.g., "Indiranagar, Bangalore" -> "Indiranagar")
                const parts = r.address!.split(',');
                return parts[0]?.trim() || r.address;
            })
    ).size;

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
                    <h1 className="text-2xl font-bold text-white">Analytics</h1>
                    <p className="text-gray-400">Overview of civic issue reporting metrics</p>
                </div>
                <div className="relative">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="appearance-none bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 pr-10 text-sm cursor-pointer"
                    >
                        <option value="7days" className="bg-[#0f172a] text-white">Last 7 days</option>
                        <option value="30days" className="bg-[#0f172a] text-white">Last 30 days</option>
                        <option value="90days" className="bg-[#0f172a] text-white">Last 90 days</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 backdrop-blur-xl rounded-xl p-5 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-400">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.total}</p>
                    <p className="text-sm text-blue-300/70">Total Reports</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-xl rounded-xl p-5 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/30 flex items-center justify-center text-green-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{resolutionRate}%</p>
                    <p className="text-sm text-green-300/70">Resolution Rate</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 backdrop-blur-xl rounded-xl p-5 border border-orange-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/30 flex items-center justify-center text-orange-400">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.pending}</p>
                    <p className="text-sm text-orange-300/70">Pending Review</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-xl rounded-xl p-5 border border-red-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/30 flex items-center justify-center text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats.urgent}</p>
                    <p className="text-sm text-red-300/70">Urgent Issues</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Status Breakdown
                    </h2>

                    <div className="space-y-4">
                        {[
                            { label: 'Resolved', value: stats.resolved, total: stats.total, color: 'bg-green-500' },
                            { label: 'In Progress', value: stats.inProgress, total: stats.total, color: 'bg-blue-500' },
                            { label: 'Pending', value: stats.pending, total: stats.total, color: 'bg-orange-500' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-300">{item.label}</span>
                                    <span className="text-white font-medium">{item.value}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} rounded-full transition-all`}
                                        style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Top Issue Categories
                    </h2>

                    <div className="space-y-4">
                        {topCategories.map(([category, count], index) => {
                            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];

                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-300 capitalize">{category.replace('_', ' ')}</span>
                                        <span className="text-white font-medium">{percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${colors[index]} rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{avgResponseTime}</p>
                            <p className="text-sm text-gray-400">Avg. Response Time</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        {resolvedReports.length} resolved reports analyzed
                    </p>
                </div>

                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{uniqueUsers}</p>
                            <p className="text-sm text-gray-400">Active Citizens</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        {uniqueUsers} unique reporters
                    </p>
                </div>

                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{uniqueAreas}</p>
                            <p className="text-sm text-gray-400">Areas Covered</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        {uniqueAreas} distinct areas reporting issues
                    </p>
                </div>
            </div>
        </div>
    );
}
