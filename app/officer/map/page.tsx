'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import type { MapReport } from '@/components/ReportsMap';
import { MapPin, Loader2, RefreshCw, AlertTriangle, Layers } from 'lucide-react';

// Dynamically import the map (no SSR — leaflet needs window)
const ReportsMap = dynamic(() => import('@/components/ReportsMap'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-slate-50 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
    ),
});

const PRIORITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    urgent: { label: 'Urgent', color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
    high:   { label: 'High',   color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    medium: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    low:    { label: 'Low',    color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
};

export default function OfficerMapPage() {
    const { user } = useAuthStore();
    const [reports, setReports]           = useState<MapReport[]>([]);
    const [wardMap, setWardMap]           = useState<Record<string, string>>({});
    const [deptMap, setDeptMap]           = useState<Record<string, string>>({});
    const [loading, setLoading]           = useState(true);
    const [priorityFilter, setPriority]   = useState<string>('all');
    const [statusFilter, setStatus]       = useState<string>('active');
    const [wardName, setWardName]         = useState<string>('');
    const [noGeo, setNoGeo]              = useState(0);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rRes, jRes] = await Promise.all([
                fetch('/api/reports'),
                fetch('/api/jurisdiction'),
            ]);

            // Build lookup maps
            const wm: Record<string, string> = {};
            const dm: Record<string, string> = {};
            if (jRes.ok) {
                const jd = await jRes.json();
                (jd.wards       || []).forEach((w: any) => { wm[w.id] = w.name; });
                (jd.departments || []).forEach((d: any) => { dm[d.id] = d.name; });
                setWardMap(wm);
                setDeptMap(dm);
            }

            if (rRes.ok) {
                const data = await rRes.json();
                let all: any[] = data.reports || [];

                // Filter to officer's ward
                if (user?.id) {
                    const { data: woRows } = await import('@/lib/supabase').then(m =>
                        m.supabase.from('ward_officers')
                            .select('ward_id')
                            .eq('officer_id', user.id)
                    );
                    if (woRows && woRows.length > 0) {
                        const wardIds = woRows.map((r: any) => r.ward_id);
                        // Use the first ward's name for the header
                        setWardName(wm[wardIds[0]] || '');
                        all = all.filter(r => r.ward_id == null || wardIds.includes(r.ward_id));
                    }
                }

                // Limit to 200 most recent
                const limited = all.slice(0, 200);
                const mapped: MapReport[] = limited.map(r => ({
                    id:              r.id,
                    category:        r.category || 'other',
                    description:     r.description,
                    address:         r.address,
                    latitude:        r.latitude,
                    longitude:       r.longitude,
                    status:          r.status,
                    priority:        r.priority,
                    ward_name:       r.ward_id  ? wm[r.ward_id]  : undefined,
                    department_name: r.department_id ? dm[r.department_id] : undefined,
                }));

                setReports(mapped);
                setNoGeo(mapped.filter(r => !r.latitude || !r.longitude).length);
            }
        } catch (e) {
            console.error('Map fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    // Apply client-side filters
    const filtered = reports.filter(r => {
        if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
        if (statusFilter === 'active' && (r.status === 'resolved' || r.status === 'rejected')) return false;
        if (statusFilter !== 'all' && statusFilter !== 'active' && r.status !== statusFilter) return false;
        return r.latitude != null && r.longitude != null;
    });

    const counts = {
        urgent: reports.filter(r => r.priority === 'urgent' && r.latitude).length,
        high:   reports.filter(r => r.priority === 'high'   && r.latitude).length,
        medium: reports.filter(r => r.priority === 'medium' && r.latitude).length,
        low:    reports.filter(r => r.priority === 'low'    && r.latitude).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-indigo-600" />
                        Civic Issues Map
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {wardName ? `Ward: ${wardName}` : 'Your jurisdiction'} — live OpenStreetMap view
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Priority legend + counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.entries(PRIORITY_LABELS) as [string, typeof PRIORITY_LABELS[string]][]).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setPriority(p => p === key ? 'all' : key)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all ${
                            priorityFilter === key
                                ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-offset-1 ring-current`
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <span>{cfg.label}</span>
                        <span className={`text-lg font-bold ${priorityFilter === key ? cfg.color : 'text-slate-800'}`}>
                            {counts[key as keyof typeof counts]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <Layers className="w-4 h-4 text-slate-400" />
                {(['all', 'active', 'pending', 'in_progress', 'resolved'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                            statusFilter === s
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                    >
                        {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-400">
                    Showing {filtered.length} of {reports.filter(r => r.latitude).length} geo-tagged reports
                    {noGeo > 0 && ` · ${noGeo} without GPS hidden`}
                </span>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: '550px' }}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-300" />
                        <p className="text-sm">Loading civic issues…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        <AlertTriangle className="w-10 h-10 text-slate-200" />
                        <p className="text-sm">No geo-tagged reports match your filters</p>
                    </div>
                ) : (
                    <ReportsMap reports={filtered} />
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 bg-white rounded-xl p-4 border border-slate-100">
                <span className="font-bold text-slate-700">Marker color:</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>Urgent</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>High</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>Medium</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Low / Resolved</span>
            </div>
        </div>
    );
}
