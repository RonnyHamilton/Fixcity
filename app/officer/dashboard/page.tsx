'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/lib/store';
import { 
    AlertTriangle, Clock, Activity, CheckCircle, 
    Calendar, Wrench
} from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Components
import KPIStatCard from '@/components/dashboard/KPIStatCard';
import ChartCard, { CustomTooltip } from '@/components/dashboard/ChartCard';
import ReportsTable, { TableReport } from '@/components/dashboard/ReportsTable';
import TechnicianCard from '@/components/dashboard/TechnicianCard';

const IssueMap = dynamic(() => import('@/components/dashboard/IssueMap'), { ssr: false });

export default function OfficerDashboard() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    const [chartDataCategory, setChartDataCategory] = useState<any[]>([]);
    const [chartDataTime, setChartDataTime] = useState<any[]>([]);
    const [tableReports, setTableReports] = useState<TableReport[]>([]);
    const [mapReports, setMapReports] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, [user?.id]);

    const fetchDashboardData = async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            // Parallel Data Fetching
            const [reportsRes, techRes, jurisdictionRes] = await Promise.all([
                fetch('/api/reports'),
                fetch('/api/technicians'),
                fetch('/api/jurisdiction'),
            ]);

            let activeReports: any[] = [];
            let techs: any[] = [];
            let wardMap: Record<string, string> = {};
            let deptMap: Record<string, string> = {};

            if (jurisdictionRes.ok) {
                const jd = await jurisdictionRes.json();
                (jd.wards || []).forEach((w: any) => { wardMap[w.id] = w.name; });
                (jd.departments || []).forEach((d: any) => { deptMap[d.id] = d.name; });
            }

            if (techRes.ok) {
                const data = await techRes.json();
                techs = data.technicians || [];
                setTechnicians(techs.slice(0, 6)); // Show top 6 techs
            }

            if (reportsRes.ok) {
                const data = await reportsRes.json();
                const allReports = data.reports || [];

                // Filter jurisdiction
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
                
                // 1. Calculate Stats
                const pending = activeReports.filter((r: any) => r.status === 'pending').length;
                const inProgress = activeReports.filter((r: any) => r.status === 'in_progress').length;
                const resolved = activeReports.filter((r: any) => r.status === 'resolved').length;
                const total = pending + inProgress + resolved;
                
                setStats({ total, pending, inProgress, resolved });

                // 2. Prepare Map Data
                const mapData = activeReports.filter((r: any) => r.status === 'pending' || r.status === 'in_progress').map((r: any) => ({
                    id: r.id,
                    category: r.category,
                    address: r.address || 'Unknown Location',
                    latitude: r.latitude,
                    longitude: r.longitude,
                    status: r.status,
                    priority: r.priority
                }));
                setMapReports(mapData);

                // 3. Prepare Table Data
                const tableData: TableReport[] = activeReports
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((r: any) => ({
                        id: r.id,
                        report_id_display: `RPT-${r.id.substring(0, 6).toUpperCase()}`,
                        category: r.category.charAt(0).toUpperCase() + r.category.slice(1),
                        address: r.address || 'Location unavailable',
                        priority: r.priority,
                        status: r.status,
                        date: new Date(r.created_at).toLocaleDateString()
                    }));
                setTableReports(tableData);

                // 4. Prepare Charts Data
                // Category Chart
                const catCounts: Record<string, number> = {};
                activeReports.forEach((r: any) => {
                    const cat = r.category.charAt(0).toUpperCase() + r.category.slice(1);
                    catCounts[cat] = (catCounts[cat] || 0) + 1;
                });
                setChartDataCategory(
                    Object.entries(catCounts)
                        .map(([name, Issues]) => ({ name, Issues }))
                        .sort((a, b) => b.Issues - a.Issues)
                        .slice(0, 6)
                );

                // Time Chart (Last 7 days)
                const timeCounts: Record<string, number> = {};
                const today = new Date();
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    const ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    timeCounts[ds] = 0;
                }
                activeReports.forEach((r: any) => {
                    const ds = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    if (timeCounts[ds] !== undefined) {
                        timeCounts[ds]++;
                    }
                });
                setChartDataTime(Object.entries(timeCounts).map(([date, count]) => ({ date, Issues: count })));
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
            {/* SECTION 1: Welcome Panel */}
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

            {/* SECTION 2: KPI Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPIStatCard 
                    title="Total Issues" 
                    value={stats.total} 
                    trend="+12%" 
                    icon={AlertTriangle} 
                    isPositive={false}
                />
                <KPIStatCard 
                    title="Pending" 
                    value={stats.pending} 
                    trend="-5%" 
                    icon={Clock} 
                    isPositive={true}
                />
                <KPIStatCard 
                    title="In Progress" 
                    value={stats.inProgress} 
                    trend="+2%" 
                    icon={Activity} 
                    isPositive={false}
                />
                <KPIStatCard 
                    title="Resolved" 
                    value={stats.resolved} 
                    trend="+18%" 
                    icon={CheckCircle} 
                    isPositive={true}
                />
            </div>

            {/* SECTION 3: Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6">
                    <ChartCard title="Issues Over Time" subtitle="Daily issue volume over the last 7 days">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartDataTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="Issues" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                
                <div className="lg:col-span-6">
                    <ChartCard title="Issues by Category" subtitle="Distribution of reported problems">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar 
                                    dataKey="Issues" 
                                    fill="#8b5cf6" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            {/* SECTION 4: Issue Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12">
                    <IssueMap reports={mapReports} />
                </div>
            </div>

            {/* SECTION 5 & 6: Content Table & Technicians */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Reports Table */}
                <div className="lg:col-span-8">
                    <ReportsTable reports={tableReports} />
                </div>
                
                {/* Technicians Panel */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex-1 flex flex-col">
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
                                        activeTasks={Math.floor(Math.random() * 5)} // Mock active tasks as it's not in technicians API directly
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
