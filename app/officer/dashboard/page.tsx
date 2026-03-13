'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    AlertTriangle, Clock, Activity, CheckCircle,
    Calendar, Wrench, TrendingUp, Target, Zap
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    Legend
} from 'recharts';

import KPIStatCard from '@/components/dashboard/KPIStatCard';
import ChartCard, { CustomTooltip } from '@/components/dashboard/ChartCard';
import ReportsTable, { TableReport } from '@/components/dashboard/ReportsTable';
import TechnicianCard from '@/components/dashboard/TechnicianCard';



const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
const PRIORITY_COLORS: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#64748b' };

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-xl">
                {payload[0].name}: {payload[0].value}
            </div>
        );
    }
    return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border-none shadow-xl rounded-xl p-3 text-white">
                <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function OfficerDashboard() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    const [chartDataCategory, setChartDataCategory] = useState<any[]>([]);
    const [chartDataTime, setChartDataTime] = useState<any[]>([]);
    const [chartDataArea, setChartDataArea] = useState<any[]>([]);
    const [priorityData, setPriorityData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [tableReports, setTableReports] = useState<TableReport[]>([]);

    const [technicians, setTechnicians] = useState<any[]>([]);
    const [resolutionRate, setResolutionRate] = useState(0);
    const [avgResponseTime, setAvgResponseTime] = useState('—');

    useEffect(() => {
        fetchDashboardData();
    }, [user?.id]);

    const fetchDashboardData = async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            const [reportsRes, techRes, jurisdictionRes] = await Promise.all([
                fetch('/api/reports'),
                fetch('/api/technicians'),
                fetch('/api/jurisdiction'),
            ]);

            let activeReports: any[] = [];
            let techs: any[] = [];

            if (techRes.ok) {
                const data = await techRes.json();
                techs = data.technicians || [];
                setTechnicians(techs.slice(0, 6));
            }

            if (reportsRes.ok) {
                const data = await reportsRes.json();
                const allReports = data.reports || [];

                const { data: woRows } = await import('@/lib/supabase').then(m =>
                    m.supabase.from('ward_officers')
                        .select('ward_id, department_id')
                        .eq('officer_id', user.id)
                );

                let filtered = allReports;
                if (woRows && woRows.length > 0) {
                    const assignedWardIds = woRows.map((r: any) => r.ward_id).filter(Boolean);
                    filtered = filtered.filter((rep: any) => rep.ward_id == null || assignedWardIds.includes(rep.ward_id));

                    const isTalukOfficer = woRows.length > 1;
                    const deptIds = [...new Set(woRows.map((r: any) => r.department_id).filter(Boolean))];
                    if (!isTalukOfficer && deptIds.length === 1) {
                        filtered = filtered.filter((rep: any) => rep.department_id == null || rep.department_id === deptIds[0]);
                    }
                }

                activeReports = filtered.filter((r: any) => !r.parent_report_id && r.status !== 'rejected');

                const pending = activeReports.filter((r: any) => r.status === 'pending').length;
                const inProgress = activeReports.filter((r: any) => r.status === 'in_progress').length;
                const resolved = activeReports.filter((r: any) => r.status === 'resolved').length;
                const total = pending + inProgress + resolved;
                const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
                setStats({ total, pending, inProgress, resolved });
                setResolutionRate(rate);

                // Pie data
                setPieData([
                    { name: 'Pending', value: pending },
                    { name: 'In Progress', value: inProgress },
                    { name: 'Resolved', value: resolved },
                    { name: 'Urgent', value: activeReports.filter((r: any) => r.priority === 'urgent').length },
                ].filter(d => d.value > 0));

                // Avg response time
                const resolvedWithTime = activeReports.filter((r: any) => r.status === 'resolved' && r.updated_at);
                if (resolvedWithTime.length > 0) {
                    const avgHrs = resolvedWithTime.reduce((acc: number, r: any) => {
                        return acc + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 3600000;
                    }, 0) / resolvedWithTime.length;
                    setAvgResponseTime(avgHrs < 1 ? `${Math.round(avgHrs * 60)}m` : avgHrs < 24 ? `${Math.round(avgHrs)}h` : `${Math.round(avgHrs / 24)}d`);
                }



                // Table data
                const tableData: TableReport[] = activeReports
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((r: any) => ({
                        id: r.id,
                        report_id_display: `RPT-${r.id.substring(0, 6).toUpperCase()}`,
                        category: r.category.charAt(0).toUpperCase() + r.category.slice(1),
                        address: r.address || 'Location unavailable',
                        priority: r.priority, status: r.status,
                        date: new Date(r.created_at).toLocaleDateString()
                    }));
                setTableReports(tableData);

                // Category bar chart
                const catCounts: Record<string, number> = {};
                activeReports.forEach((r: any) => {
                    const cat = r.category.charAt(0).toUpperCase() + r.category.slice(1);
                    catCounts[cat] = (catCounts[cat] || 0) + 1;
                });
                setChartDataCategory(
                    Object.entries(catCounts)
                        .map(([name, Issues]) => ({ name: name.replace('_', ' '), Issues }))
                        .sort((a, b) => b.Issues - a.Issues)
                        .slice(0, 6)
                );

                // Last 7 days area chart (Submitted vs Resolved)
                const today = new Date();
                const timeDays: { date: string; Submitted: number; Resolved: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(); d.setDate(today.getDate() - i);
                    const ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    timeDays.push({ date: ds, Submitted: 0, Resolved: 0 });
                }
                activeReports.forEach((r: any) => {
                    const ds = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const entry = timeDays.find(d => d.date === ds);
                    if (entry) { entry.Submitted++; if (r.status === 'resolved') entry.Resolved++; }
                });
                setChartDataArea(timeDays);
                setChartDataTime(timeDays);

                // Priority radar data
                const pCounts: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
                activeReports.forEach((r: any) => { if (pCounts[r.priority] !== undefined) pCounts[r.priority]++; });
                setPriorityData(Object.entries(pCounts).map(([priority, value]) => ({
                    priority: priority.charAt(0).toUpperCase() + priority.slice(1), value
                })));
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Officer'}</h1>
                    <p className="text-sm text-slate-500 mt-1">Here is the latest snapshot of your jurisdiction's activity.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPIStatCard title="Total Issues" value={stats.total} trend="+12%" icon={AlertTriangle} isPositive={false} />
                <KPIStatCard title="Pending" value={stats.pending} trend="-5%" icon={Clock} isPositive={true} />
                <KPIStatCard title="In Progress" value={stats.inProgress} trend="+2%" icon={Activity} isPositive={false} />
                <KPIStatCard title="Resolved" value={stats.resolved} trend="+18%" icon={CheckCircle} isPositive={true} />
            </div>

            {/* Extra metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{resolutionRate}%</p>
                        <p className="text-sm text-emerald-100 font-medium">Resolution Rate</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{avgResponseTime}</p>
                        <p className="text-sm text-blue-100 font-medium">Avg. Response Time</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%</p>
                        <p className="text-sm text-orange-100 font-medium">Pending Rate</p>
                    </div>
                </div>
            </div>

            {/* Charts Row 1: Area + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                    <ChartCard title="Activity This Week" subtitle="Daily submitted vs resolved issues over 7 days">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={chartDataArea} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="submitted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                                <Area type="monotone" dataKey="Submitted" stroke="#3b82f6" strokeWidth={2.5} fill="url(#submitted)" dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }} />
                                <Area type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} fill="url(#resolved)" dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div className="lg:col-span-5">
                    <ChartCard title="Status Distribution" subtitle="Breakdown of all reports by current status">
                        <div className="flex items-center gap-4 h-[280px]">
                            <ResponsiveContainer width="60%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-3 flex-1">
                                {pieData.map((item, i) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
                                            <p className="text-lg font-bold text-slate-900 leading-none">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ChartCard>
                </div>
            </div>

            {/* Charts Row 2: Category Bar + Priority Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                    <ChartCard title="Issues by Category" subtitle="Distribution of reported problems">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={chartDataCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="Issues" radius={[6, 6, 0, 0]} barSize={32}>
                                    {chartDataCategory.map((_, i) => (
                                        <Cell key={i} fill={['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'][i % 6]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div className="lg:col-span-5">
                    <ChartCard title="Priority Breakdown" subtitle="Distribution of reports by urgency level">
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="75%">
                                <RadarChart data={priorityData} cx="50%" cy="55%">
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="priority" tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Radar name="Reports" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                                    <Tooltip formatter={(v) => [v, 'Reports']} />
                                </RadarChart>
                            </ResponsiveContainer>
                            <div className="flex justify-around mt-2">
                                {priorityData.map(p => (
                                    <div key={p.priority} className="text-center">
                                        <p className="text-lg font-bold text-slate-900">{p.value}</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{p.priority}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ChartCard>
                </div>
            </div>



            {/* Table + Technicians */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <ReportsTable reports={tableReports} />
                </div>
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Technicians</h3>
                                <p className="text-sm text-slate-500 mt-1">Available workforce</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Wrench className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            {technicians.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">No technicians assigned</p>
                            ) : (
                                technicians.map(tech => (
                                    <TechnicianCard
                                        key={tech.id}
                                        name={tech.name}
                                        specialization={tech.specialization}
                                        available={tech.available}
                                        activeTasks={Math.floor(Math.random() * 5)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
