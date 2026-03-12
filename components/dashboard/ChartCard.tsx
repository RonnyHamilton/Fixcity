'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
}

export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <div className="flex-1 w-full min-h-[300px]">
                {children}
            </div>
        </div>
    );
}

// Custom tooltip renderer for Recharts to match the SaaS look
export const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border-none shadow-xl rounded-xl p-3 text-white">
                <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-bold">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}:</span>
                        <span>{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};
