'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    Users, Shield, MapPin, Building2, FileText,
    Crown, TrendingUp, Activity, Clock, CheckCircle,
    AlertTriangle, BarChart3, Calendar, Target
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, RadialBarChart, RadialBar
} from 'recharts';

interface DashboardStats {
    totalOfficers: number;
    talukOfficers: number;
    wardOfficers: number;
    totalReports: number;
    totalWards: number;
    totalTaluks: number;
    totalDepartments: number;
    pendingReports: number;
    inProgressReports: number;
    resolvedReports: number;
    urgentReports: number;
    resolutionRate: number;
    avgResponseTimeHrs: number;
}

interface Report {
    id: string;
    user_name: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at?: string;
    address?: string;
    ward_id?: string;
    wards?: any;
}

interface TalukStat {
    name: string;
    total: number;
    pending: number;
    resolved: number;
    inProgress: number;
}

interface CategoryStat {
    name: string;
    count: number;
    percentage: number;
}

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 shadow-xl rounded-xl p-3 text-white border-none">
                {label && <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>}
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}:</span><span>{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

function formatResponseTime(hrs: number) {
    if (hrs < 1) return `${Math.round(hrs * 60)}m`;
    if (hrs < 24) return `${Math.round(hrs)}h`;
    return `${Math.round(hrs / 24)}d`;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function SuperAdminDashboard() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalOfficers: 0, talukOfficers: 0, wardOfficers: 0,
        totalReports: 0, totalWards: 0, totalTaluks: 0, totalDepartments: 0,
        pendingReports: 0, inProgressReports: 0, resolvedReports: 0,
        urgentReports: 0, resolutionRate: 0, avgResponseTimeHrs: 0,
    });
    const [recentReports, setRecentReports] = useState<Report[]>([]);
    const [talukStats, setTalukStats] = useState<TalukStat[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [areaChartData, setAreaChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [radialData, setRadialData] = useState<any[]>([]);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const { supabase } = await import('@/lib/supabase');

            const [reportsRes, wardsRes, taluksRes, deptsRes, talukOfficersRes] = await Promise.all([
                supabase.from('reports').select(`
                    id, user_name, category, status, priority, created_at, updated_at, address, ward_id,
                    wards:ward_id (name, taluks:taluk_id(name))
                `).is('parent_report_id', null).order('created_at', { ascending: false }),
                supabase.from('wards').select('id', { count: 'exact' }),
                supabase.from('taluks').select('id', { count: 'exact' }),
                supabase.from('departments').select('id', { count: 'exact' }),
                supabase.from('ward_officers').select('officer_id, ward_id'),
            ]);

            const reports: Report[] = reportsRes.data || [];
            const recent = reports.slice(0, 8);

            const pending = reports.filter(r => r.status === 'pending').length;
            const inProgress = reports.filter(r => r.status === 'in_progress').length;
            const resolved = reports.filter(r => r.status === 'resolved').length;
            const urgent = reports.filter(r => r.priority === 'urgent').length;
            const total = reports.length;
            const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

            const resolvedWithTime = reports.filter(r => r.status === 'resolved' && r.updated_at);
            const avgHrs = resolvedWithTime.length > 0
                ? resolvedWithTime.reduce((acc, r) => acc + (new Date(r.updated_at!).getTime() - new Date(r.created_at).getTime()) / 3600000, 0) / resolvedWithTime.length
                : 0;

            // Category stats
            const catMap: Record<string, number> = {};
            reports.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + 1; });
            const catStats = Object.entries(catMap)
                .sort((a, b) => b[1] - a[1]).slice(0, 6)
                .map(([name, count]) => ({
                    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    count, percentage: total > 0 ? Math.round((count / total) * 100) : 0
                }));

            // Taluk stats
            const talukMap: Record<string, TalukStat> = {};
            reports.forEach(r => {
                const taluk = (r.wards as any)?.taluks?.name || 'Unassigned';
                if (!talukMap[taluk]) talukMap[taluk] = { name: taluk, total: 0, pending: 0, resolved: 0, inProgress: 0 };
                talukMap[taluk].total++;
                if (r.status === 'pending') talukMap[taluk].pending++;
                else if (r.status === 'resolved') talukMap[taluk].resolved++;
                else if (r.status === 'in_progress') talukMap[taluk].inProgress++;
            });
            const tStats = Object.values(talukMap).sort((a, b) => b.total - a.total).slice(0, 6);

            // Officer breakdown
            const officerWardCounts: Record<string, number> = {};
            (talukOfficersRes.data || []).forEach((r: any) => {
                officerWardCounts[r.officer_id] = (officerWardCounts[r.officer_id] || 0) + 1;
            });
            const talukOfficersCount = Object.values(officerWardCounts).filter(c => c > 1).length;
            const wardOfficersCount = Object.values(officerWardCounts).filter(c => c === 1).length;
            const uniqueOfficers = Object.keys(officerWardCounts).length;

            // Area chart - last 14 days
            const today = new Date();
            const areaData: any[] = [];
            for (let i = 13; i >= 0; i--) {
                const d = new Date(); d.setDate(today.getDate() - i);
                const ds = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                areaData.push({ date: ds, Submitted: 0, Resolved: 0 });
            }
            reports.forEach(r => {
                const ds = new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                const entry = areaData.find(d => d.date === ds);
                if (entry) { entry.Submitted++; if (r.status === 'resolved') entry.Resolved++; }
            });

            // Pie data
            const pie = [
                { name: 'Pending', value: pending },
                { name: 'In Progress', value: inProgress },
                { name: 'Resolved', value: resolved },
                { name: 'Urgent', value: urgent },
            ].filter(d => d.value > 0);

            // Radial bar for resolution rate display
            const radial = [
                { name: 'Rate', value: resolutionRate, fill: '#10b981' },
            ];

            setStats({
                totalOfficers: uniqueOfficers, talukOfficers: talukOfficersCount, wardOfficers: wardOfficersCount,
                totalReports: total, totalWards: wardsRes.count || 0, totalTaluks: taluksRes.count || 0,
                totalDepartments: deptsRes.count || 0,
                pendingReports: pending, inProgressReports: inProgress, resolvedReports: resolved,
                urgentReports: urgent, resolutionRate, avgResponseTimeHrs: avgHrs,
            });
            setRecentReports(recent);
            setTalukStats(tStats);
            setCategoryStats(catStats);
            setAreaChartData(areaData);
            setPieData(pie);
            setRadialData(radial);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    const kpiCards = [
        { title: 'Total Reports', value: stats.totalReports, icon: FileText, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
        { title: 'Pending', value: stats.pendingReports, icon: Clock, gradient: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/20' },
        { title: 'In Progress', value: stats.inProgressReports, icon: Activity, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
        { title: 'Resolved', value: stats.resolvedReports, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
        { title: 'Urgent Issues', value: stats.urgentReports, icon: AlertTriangle, gradient: 'from-red-500 to-rose-500', shadow: 'shadow-red-500/20' },
        { title: 'Total Officers', value: stats.totalOfficers, icon: Users, gradient: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
        { title: 'Taluks', value: stats.totalTaluks, icon: Building2, gradient: 'from-slate-600 to-slate-700', shadow: 'shadow-slate-500/20' },
        { title: 'Wards', value: stats.totalWards, icon: MapPin, gradient: 'from-indigo-500 to-blue-500', shadow: 'shadow-indigo-500/20' },
    ];

    const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
        pending: { label: 'Pending', color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
        in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
        resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
        rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
        closed: { label: 'Closed', color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Crown className="w-7 h-7 text-amber-500" />
                        Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
                    </h1>
                    <p className="text-slate-500 mt-1">System-wide overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 shadow-sm">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Live data
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg ${card.shadow} group`}>
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-5 translate-x-5 group-hover:scale-125 transition-transform duration-300" />
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-white">{card.value}</p>
                                <p className="text-xs text-white/70 font-medium mt-0.5">{card.title}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Row 2: Area chart (full width) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Report Trends — Last 14 Days</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Daily submitted vs resolved reports across all taluks</p>
                    </div>
                    <div className="flex gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-amber-500 inline-block" />Submitted</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-emerald-500 inline-block" />Resolved</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={areaChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="submitted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 2' }} />
                        <Area type="monotone" dataKey="Submitted" stroke="#f59e0b" strokeWidth={2.5} fill="url(#submitted)" dot={false} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }} />
                        <Area type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} fill="url(#resolvedGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Row 3: Status Pie + Officers + Radial */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Pie: Status Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-amber-500" />
                        Status Distribution
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">All reports by current status</p>
                    <div className="flex items-center gap-4">
                        <ResponsiveContainer width="55%" height={180}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={48}
                                    dataKey="value" paddingAngle={3} stroke="none"
                                    labelLine={false} label={<CustomPieLabel />}>
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-3 flex-1">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <span className="text-xs text-slate-600 font-medium truncate">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Officers Overview */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-500" />
                        Officers
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">Officer breakdown by role</p>
                    <div className="space-y-3">
                        {[
                            { label: 'Total Officers', val: stats.totalOfficers, color: 'bg-violet-500', textColor: 'text-violet-700', bgColor: 'bg-violet-50' },
                            { label: 'Taluk Officers', val: stats.talukOfficers, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
                            { label: 'Ward Officers', val: stats.wardOfficers, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
                            { label: 'Departments', val: stats.totalDepartments, color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
                        ].map(item => (
                            <div key={item.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${item.bgColor} border border-white`}>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                    <span className={`text-sm font-semibold ${item.textColor}`}>{item.label}</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resolution + Avg Response */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-500" />
                        Performance
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">Resolution metrics</p>
                    {/* Radial chart for resolution rate */}
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={160}>
                            <RadialBarChart
                                cx="50%" cy="50%" innerRadius="55%" outerRadius="90%"
                                data={[{ name: 'Rate', value: stats.resolutionRate, fill: '#10b981' }]}
                                startAngle={220} endAngle={-40}
                            >
                                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
                                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="font-bold" style={{ fontSize: 28, fontWeight: 800, fill: '#0f172a' }}>
                                    {stats.resolutionRate}%
                                </text>
                                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}>
                                    Resolution Rate
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-3 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">{formatResponseTime(stats.avgResponseTimeHrs)}</p>
                            <p className="text-xs text-slate-400 font-medium">Avg. Response Time</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">{stats.resolvedReports}</p>
                            <p className="text-xs text-slate-400 font-medium">Issues Closed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">{stats.urgentReports}</p>
                            <p className="text-xs text-slate-400 font-medium">Urgent Open</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 4: Stacked Bar (Taluk) + Category Bar */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Stacked bar chart by Taluk */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-amber-500" />
                        Reports by Taluk
                    </h2>
                    <p className="text-xs text-slate-400 mb-5">Stacked by status per taluk</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={talukStats} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                            barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }} dy={10} angle={-15} textAnchor="end" />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                            <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[0, 0, 0, 0]} stackId="a" />
                            <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" stackId="a" />
                            <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category horizontal bars */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        Issues by Category
                    </h2>
                    <p className="text-xs text-slate-400 mb-5">Top 6 reported issue types</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={categoryStats} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="count" name="Reports" radius={[0, 6, 6, 0]} barSize={18}>
                                {categoryStats.map((_, i) => (
                                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Reports Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-500" />
                        Recent Reports
                    </h2>
                    <a href="/super-admin/reports" className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                        View all →
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['ID', 'Category', 'Reporter', 'Ward', 'Status', 'Priority', 'Time'].map((h, i) => (
                                    <th key={h} className={`${i === 6 ? 'text-right pr-6' : i === 0 ? 'pl-6' : ''} px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-left`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentReports.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No reports yet</td></tr>
                            ) : recentReports.map((report) => {
                                const s = STATUS_MAP[report.status] || STATUS_MAP.pending;
                                const wardName = (report.wards as any)?.name || '—';
                                return (
                                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3.5"><span className="font-mono text-xs text-slate-400">#{report.id.slice(-6)}</span></td>
                                        <td className="px-4 py-3.5"><span className="font-medium text-slate-800 capitalize">{report.category.replace(/_/g, ' ')}</span></td>
                                        <td className="px-4 py-3.5 text-slate-600">{report.user_name}</td>
                                        <td className="px-4 py-3.5"><span className="text-slate-600 text-xs">{wardName}</span></td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.color} ${s.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                {s.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                report.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                                                report.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                report.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>{report.priority}</span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right text-xs text-slate-400">{timeAgo(report.created_at)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
