'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    Users, MapPin, Phone, Mail, Wrench, Clock,
    CheckCircle, AlertCircle, Search, Filter, ChevronDown, Briefcase, Star
} from 'lucide-react';

interface Technician {
    id: string;
    badge_id: string;
    name: string;
    email: string;
    area: string;
    specialization: string;
    available: boolean;
}

export default function OfficerTechniciansPage() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            const response = await fetch('/api/technicians');
            if (response.ok) {
                const data = await response.json();
                setTechnicians(data.technicians || []);
            }
        } catch (error) {
            console.error('Failed to fetch technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter technicians
    let filteredTechnicians = technicians;

    if (filter === 'available') {
        filteredTechnicians = filteredTechnicians.filter(t => t.available);
    } else if (filter === 'unavailable') {
        filteredTechnicians = filteredTechnicians.filter(t => !t.available);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredTechnicians = filteredTechnicians.filter(t =>
            t.name.toLowerCase().includes(query) ||
            t.area.toLowerCase().includes(query) ||
            t.specialization.toLowerCase().includes(query)
        );
    }

    // Group by area
    const techniciansByArea = filteredTechnicians.reduce((acc, tech) => {
        if (!acc[tech.area]) acc[tech.area] = [];
        acc[tech.area].push(tech);
        return acc;
    }, {} as Record<string, Technician[]>);

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Field Technicians</h1>
                    <p className="text-slate-500">{technicians.length} total staff members</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-bold text-emerald-700">
                            {technicians.filter(t => t.available).length} Available
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span className="text-sm font-bold text-red-700">
                            {technicians.filter(t => !t.available).length} Busy
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
                        className="w-full h-11 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        placeholder="Search technicians by name, area, or skill..."
                    />
                </div>

                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto">
                    {['all', 'available', 'unavailable'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${filter === f
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Technicians by Area */}
            {Object.entries(techniciansByArea).map(([area, techs]) => (
                <div key={area} className="space-y-4">
                    <div className="flex items-center gap-2 pl-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-bold text-slate-800">
                            {area}
                        </h2>
                        <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{techs.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {techs.map((tech) => (
                            <div
                                key={tech.id}
                                className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all group flex flex-col items-center text-center relative overflow-hidden"
                            >
                                {/* Status Banner */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${tech.available ? 'bg-emerald-500' : 'bg-red-500'}`} />

                                <div className={`w-20 h-20 rounded-2xl mb-4 flex items-center justify-center text-2xl font-bold shadow-inner ${tech.available
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-red-50 text-red-600'
                                    }`}>
                                    {tech.name.charAt(0)}
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1">{tech.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">#{tech.badge_id}</p>

                                <div className="w-full space-y-3">
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl text-left">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                                            <Wrench className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Specialization</p>
                                            <p className="text-sm font-semibold text-slate-700">{tech.specialization}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl text-left">
                                        <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0 ${tech.available ? 'text-emerald-500' : 'text-red-500'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${tech.available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                                            <p className={`text-sm font-bold ${tech.available ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {tech.available ? 'Available' : 'Busy'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {filteredTechnicians.length === 0 && (
                <div className="bg-white rounded-[24px] p-16 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Users className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Technicians Found</h3>
                    <p className="text-slate-400">
                        {searchQuery ? 'No technicians match your search' : 'No technicians found in this category'}
                    </p>
                </div>
            )}
        </div>
    );
}
