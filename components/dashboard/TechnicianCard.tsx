'use client';

import clsx from 'clsx';
import { Briefcase, Activity } from 'lucide-react';

interface TechnicianCardProps {
    name: string;
    specialization: string;
    activeTasks: number;
    available: boolean;
}

export default function TechnicianCard({ name, specialization, activeTasks, available }: TechnicianCardProps) {
    return (
        <div className="bg-white rounded-[16px] border border-slate-100 p-4 hover:shadow-sm hover:border-slate-200 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-lg font-bold text-slate-600">
                            {name.charAt(0)}
                        </span>
                    </div>
                    <div className={clsx(
                        "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                        available ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {specialization}
                        </span>
                    </div>
                </div>
            </div>

            <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    {activeTasks} Active
                </div>
                <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {available ? (
                        <span className="text-emerald-600">Available</span>
                    ) : (
                        <span className="text-amber-600">Busy</span>
                    )}
                </div>
            </div>
        </div>
    );
}
