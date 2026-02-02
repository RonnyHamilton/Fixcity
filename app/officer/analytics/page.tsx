'use client';

import { useEffect, useState } from 'react';
import {
    BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle,
    Calendar, ChevronDown, FileText, Users, MapPin, Activity, PieChart
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Analytics Review</h1>
                    <p className="text-slate-500">Overview of civic issue reporting and resolution metrics</p>
                </div>
                <div className="relative">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                    >
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                        <option value="90days">Last 90 days</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Overview Stats Cards - Gradient Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[20px] p-5 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{stats.total}</p>
                        <p className="text-sm text-blue-100 font-medium">Total Reports</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[20px] p-5 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{resolutionRate}%</p>
                        <p className="text-sm text-emerald-100 font-medium">Resolution Rate</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[20px] p-5 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{stats.pending}</p>
                        <p className="text-sm text-orange-100 font-medium">Pending Review</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-[20px] p-5 text-white shadow-lg shadow-red-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{stats.urgent}</p>
                        <p className="text-sm text-red-100 font-medium">Urgent Issues</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Status Breakdown
                    </h2>

                    <div className="space-y-6">
                        {[
                            { label: 'Resolved', value: stats.resolved, total: stats.total, color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'In Progress', value: stats.inProgress, total: stats.total, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Pending', value: stats.pending, total: stats.total, color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-2.5">
                                    <span className="text-slate-600 font-medium">{item.label}</span>
                                    <span className={`${item.text} font-bold bg-white px-2 rounded-md shadow-sm border border-slate-100`}>{item.value}</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                                        style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-500" />
                        Top Issue Categories
                    </h2>

                    <div className="space-y-5">
                        {topCategories.map(([category, count], index) => {
                            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                            const colors = [
                                { bar: 'bg-blue-500', text: 'text-blue-600', icon: 'bg-blue-100' },
                                { bar: 'bg-emerald-500', text: 'text-emerald-600', icon: 'bg-emerald-100' },
                                { bar: 'bg-purple-500', text: 'text-purple-600', icon: 'bg-purple-100' },
                                { bar: 'bg-orange-500', text: 'text-orange-600', icon: 'bg-orange-100' },
                                { bar: 'bg-pink-500', text: 'text-pink-600', icon: 'bg-pink-100' }
                            ];
                            const color = colors[index % colors.length];

                            return (
                                <div key={category} className="group">
                                    <div className="flex justify-between text-sm mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${color.bar}`}></div>
                                            <span className="text-slate-600 font-medium capitalize">{category.replace('_', ' ')}</span>
                                        </div>
                                        <span className={`${color.text} font-bold`}>{percentage}%</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color.bar} rounded-full transition-all duration-1000 ease-out group-hover:opacity-80`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-all">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4 ring-8 ring-blue-50/50">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">{avgResponseTime}</p>
                    <p className="text-sm font-medium text-slate-400">Avg. Response Time</p>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-50 px-2 py-1 rounded-lg">
                        Based on {resolvedReports.length} resolved reports
                    </p>
                </div>

                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-all">
                    <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-4 ring-8 ring-purple-50/50">
                        <Users className="w-8 h-8" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">{uniqueUsers}</p>
                    <p className="text-sm font-medium text-slate-400">Active Citizens</p>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-50 px-2 py-1 rounded-lg">
                        Unique reporters
                    </p>
                </div>

                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-all">
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4 ring-8 ring-orange-50/50">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">{uniqueAreas}</p>
                    <p className="text-sm font-medium text-slate-400">Areas Covered</p>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-50 px-2 py-1 rounded-lg">
                        Distinct locations
                    </p>
                </div>
            </div>
        </div>
    );
}
