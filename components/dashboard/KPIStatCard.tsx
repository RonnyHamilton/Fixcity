'use client';

import { ElementType } from 'react';
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPIStatCardProps {
    title: string;
    value: number | string;
    trend: string;
    icon: ElementType;
    isPositive?: boolean;
}

export default function KPIStatCard({ title, value, trend, icon: Icon, isPositive = true }: KPIStatCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                {trend && (
                    <div className={clsx(
                        "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} /> : <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.5} />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">{value}</h3>
                <p className="text-sm font-medium text-slate-500">{title}</p>
            </div>
        </div>
    );
}
