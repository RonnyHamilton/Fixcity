'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
    Users, MapPin, Phone, Mail, Wrench, Clock,
    CheckCircle, AlertCircle, Search, Filter, ChevronDown
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Technicians</h1>
                    <p className="text-gray-400">{technicians.length} total technicians</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                        {technicians.filter(t => t.available).length} Available
                    </span>
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                        {technicians.filter(t => !t.available).length} Busy
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Search technicians..."
                    />
                </div>

                <div className="flex gap-2">
                    {['all', 'available', 'unavailable'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Technicians by Area */}
            {Object.entries(techniciansByArea).map(([area, techs]) => (
                <div key={area} className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            {area}
                        </h2>
                        <span className="text-sm text-gray-400">{techs.length} technicians</span>
                    </div>

                    <div className="divide-y divide-white/5">
                        {techs.map((tech) => (
                            <div
                                key={tech.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.02] transition-all"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${tech.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        <Wrench className="w-6 h-6" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-white font-medium truncate">{tech.name}</p>
                                            <span className={`w-2 h-2 rounded-full ${tech.available ? 'bg-green-400' : 'bg-red-400'}`} />
                                            <span className="text-xs text-gray-500">#{tech.badge_id}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm truncate">{tech.specialization} Specialist</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pl-16 sm:pl-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tech.available
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {tech.available ? 'Available' : 'Busy'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {filteredTechnicians.length === 0 && (
                <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Technicians Found</h3>
                    <p className="text-gray-400">
                        {searchQuery ? 'No technicians match your search' : 'No technicians with this status'}
                    </p>
                </div>
            )}
        </div>
    );
}
