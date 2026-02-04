'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Shield, Wrench, Lock, CheckCircle, Zap, ArrowLeft } from 'lucide-react';

const portals = [
    {
        title: 'Public Citizen',
        description: 'Report issues, track status, and view community impact.',
        icon: User,
        href: '/login/public',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'hover:border-blue-200',
    },
    {
        title: 'Civic Officer',
        description: 'Validate reports, assign tasks, and monitor analytics.',
        icon: Shield,
        href: '/login/officer',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'hover:border-blue-200',
    },
    {
        title: 'Technician',
        description: 'Manage work orders, update status, and resolve on-site.',
        icon: Wrench,
        href: '/login/technician',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'hover:border-blue-200',
    },
];

export default function LoginSelectionPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#fffdf9] via-white to-[#f8f7f4]">

            {/* Decorative Mandala Pattern - Top Left */}
            <div
                className="absolute top-0 left-0 w-[400px] h-[400px] opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='80' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='60' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='40' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='20' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                }}
            />

            {/* Decorative Mandala Pattern - Top Right */}
            <div
                className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='80' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='60' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='40' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='20' fill='none' stroke='%23926f34' stroke-width='0.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                }}
            />

            {/* India Map Watermark - Bottom Right */}
            <div
                className="absolute bottom-0 right-0 w-[300px] h-[350px] opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 120'%3E%3Cpath d='M50 5 L70 15 L80 35 L85 55 L80 75 L70 90 L60 100 L50 115 L40 100 L30 90 L20 75 L15 55 L20 35 L30 15 Z' fill='%23334155' stroke='none'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                }}
            />

            {/* Back Button - Top Right */}
            <Link
                href="/"
                className="absolute top-6 right-6 z-20 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
            >
                <span className="hidden sm:inline">Back</span>
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
            </Link>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-5xl px-4 py-8 md:py-12">

                {/* Header with Emblem and Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center gap-2 mb-6 md:mb-10"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                        </div>
                        <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">FixCity</span>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-center text-slate-900 mb-3 md:mb-4 tracking-tight"
                >
                    Choose your portal.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-slate-500 text-sm md:text-lg text-center max-w-lg mx-auto mb-8 md:mb-12 px-4"
                >
                    Secure access points for citizens, officers, and technicians.
                </motion.p>

                {/* Portal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                    {portals.map((portal, idx) => (
                        <Link key={portal.title} href={portal.href} className="contents">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                className={`group relative p-5 md:p-8 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-xl transition-all cursor-pointer flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 ${portal.borderColor}`}
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-full ${portal.bgColor} flex items-center justify-center md:mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-100`}>
                                    <portal.icon className={`w-7 h-7 md:w-10 md:h-10 ${portal.color}`} strokeWidth={1.5} />
                                </div>

                                <div className="flex-1 md:flex-none">
                                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1 md:mb-3">{portal.title}</h3>
                                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                                        {portal.description}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-4 mb-10"
                >
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Lock className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">Secure Data</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-600">Government Approved</span>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-center"
                >
                    <p className="text-slate-400 text-xs">© 2026 FixCity Inc. Secured Portal.</p>
                </motion.div>
            </div>
        </div>
    );
}
