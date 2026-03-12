'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    Shield, MapPin, Wrench, Search, Users, Mail, Phone
} from 'lucide-react';

interface WardOfficerCard {
    officer_id: string;
    officer_name: string;
    officer_email: string;
    officer_area: string;
    ward_name: string;
    department_name: string | null;
}

export default function WardOfficersPage() {
    const { user } = useAuthStore();
    const [officers, setOfficers] = useState<WardOfficerCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [wardFilter, setWardFilter] = useState('all');

    useEffect(() => {
        fetchWardOfficers();
    }, []);

    const fetchWardOfficers = async () => {
        try {
            if (!user?.id) return;

            const { supabase } = await import('@/lib/supabase');

            // 1. Get the taluk officer's assigned wards
            const { data: myWards } = await supabase
                .from('ward_officers')
                .select('ward_id')
                .eq('officer_id', user.id);

            if (!myWards || myWards.length <= 1) {
                setLoading(false);
                return; // Not a taluk officer
            }

            const wardIds = myWards.map((w: any) => w.ward_id);

            // 2. Get all ward officer assignments in those wards (excluding self)
            const { data: woRows } = await supabase
                .from('ward_officers')
                .select('officer_id, ward_id, department_id, wards(name), departments(name)')
                .in('ward_id', wardIds)
                .neq('officer_id', user.id);

            // 3. Load officer details from officers.json
            let officerDetails: Record<string, { name: string; email: string; area: string }> = {};
            try {
                const ojRes = await import('@/data/officers.json');
                const arr = Array.isArray(ojRes.default) ? ojRes.default : ojRes;
                (arr as any[]).forEach((o: any) => {
                    officerDetails[o.id] = { name: o.name, email: o.email || '', area: o.area || '' };
                });
            } catch { /* ignore */ }

            if (woRows && woRows.length > 0) {
                const list: WardOfficerCard[] = woRows.map((r: any) => ({
                    officer_id:      r.officer_id,
                    officer_name:    officerDetails[r.officer_id]?.name || r.officer_id,
                    officer_email:   officerDetails[r.officer_id]?.email || '',
                    officer_area:    officerDetails[r.officer_id]?.area || '',
                    ward_name:       Array.isArray(r.wards) ? r.wards[0]?.name : r.wards?.name || r.ward_id,
                    department_name: Array.isArray(r.departments) ? r.departments[0]?.name : r.departments?.name || null,
                }));
                setOfficers(list);
            }
        } catch (error) {
            console.error('Failed to fetch ward officers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter + search
    let filtered = officers;
    if (wardFilter !== 'all') {
        filtered = filtered.filter(o => o.ward_name === wardFilter);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(o =>
            o.officer_name.toLowerCase().includes(q) ||
            o.ward_name.toLowerCase().includes(q) ||
            (o.department_name || '').toLowerCase().includes(q)
        );
    }

    // Unique ward names for filter tabs
    const wardNames = [...new Set(officers.map(o => o.ward_name))];

    // Group by ward
    const byWard = filtered.reduce((acc, o) => {
        if (!acc[o.ward_name]) acc[o.ward_name] = [];
        acc[o.ward_name].push(o);
        return acc;
    }, {} as Record<string, WardOfficerCard[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-violet-600" />
                        Ward Officers
                    </h1>
                    <p className="text-slate-500">{officers.length} officers across {wardNames.length} wards in your jurisdiction</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-xl border border-violet-100">
                        <Users className="w-4 h-4 text-violet-600" />
                        <span className="text-sm font-bold text-violet-700">
                            {officers.length} Total
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-700">
                            {wardNames.length} Wards
                        </span>
                    </div>
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
                        className="w-full h-11 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                        placeholder="Search officers by name, ward, or department..."
                    />
                </div>

                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto">
                    <button
                        onClick={() => setWardFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${wardFilter === 'all'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        All Wards
                    </button>
                    {wardNames.map((w) => (
                        <button
                            key={w}
                            onClick={() => setWardFilter(w)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${wardFilter === w
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
            </div>

            {/* Officers by Ward */}
            {Object.entries(byWard).map(([ward, wOfficers]) => (
                <div key={ward} className="space-y-4">
                    <div className="flex items-center gap-2 pl-2">
                        <MapPin className="w-5 h-5 text-violet-500" />
                        <h2 className="text-lg font-bold text-slate-800">
                            {ward}
                        </h2>
                        <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{wOfficers.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wOfficers.map((officer) => (
                            <div
                                key={`${officer.officer_id}-${officer.ward_name}`}
                                className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-violet-100 transition-all group flex flex-col items-center text-center relative overflow-hidden"
                            >
                                {/* Top accent */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500" />

                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-2xl mb-4 flex items-center justify-center text-2xl font-bold shadow-inner bg-violet-50 text-violet-600">
                                    {officer.officer_name.charAt(0).toUpperCase()}
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1">{officer.officer_name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ward Officer</p>

                                <div className="w-full space-y-3">
                                    {/* Ward */}
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl text-left">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Ward</p>
                                            <p className="text-sm font-semibold text-slate-700">{officer.ward_name}</p>
                                        </div>
                                    </div>

                                    {/* Department */}
                                    {officer.department_name && (
                                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl text-left">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                                                <Wrench className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                                                <p className="text-sm font-semibold text-slate-700">{officer.department_name}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email */}
                                    {officer.officer_email && (
                                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl text-left">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                                <p className="text-sm font-semibold text-slate-700 truncate">{officer.officer_email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {filtered.length === 0 && (
                <div className="bg-white rounded-[24px] p-16 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Shield className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Ward Officers Found</h3>
                    <p className="text-slate-400">
                        {searchQuery ? 'No officers match your search' : 'No ward officers assigned to your jurisdiction yet'}
                    </p>
                </div>
            )}
        </div>
    );
}
