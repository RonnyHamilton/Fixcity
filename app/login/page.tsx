'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Shield, Wrench, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

export default function LoginSelectionPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-[#0a0f16] selection:bg-primary/30 selection:text-primary-foreground">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-5xl px-4 py-8">
                <div className="flex flex-col items-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Zap className="w-6 h-6 text-white fill-current" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">FixCity</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-center mb-4 tracking-tight"
                    >
                        Choose your portal.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-400 text-lg text-center max-w-lg"
                    >
                        Secure access points for citizens, officers, and technicians.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Public User */}
                    <Link href="/login/public" className="contents">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            whileHover={{ y: -5 }}
                            className="glass-card group relative p-8 rounded-[2rem] border border-white/5 hover:border-primary/50 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <User className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">Public Citizen</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                Report issues, track status, and view community impact.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-blue-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                Login Access <ArrowRight className="w-4 h-4" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Civic Officer */}
                    <Link href="/login/officer" className="contents">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            whileHover={{ y: -5 }}
                            className="glass-card group relative p-8 rounded-[2rem] border border-white/5 hover:border-purple-500/50 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Shield className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">Civic Officer</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                Validate reports, assign tasks, and monitor analytics.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-purple-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                Staff Access <ArrowRight className="w-4 h-4" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Field Technician */}
                    <Link href="/login/technician" className="contents">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="glass-card group relative p-8 rounded-[2rem] border border-white/5 hover:border-emerald-500/50 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Wrench className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">Technician</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                Manage work orders, update status, and resolve on-site.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-emerald-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                Partner Access <ArrowRight className="w-4 h-4" />
                            </div>
                        </motion.div>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-16 text-center"
                >
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </motion.div>

                {/* Copyright */}
                <div className="mt-8 text-center">
                    <p className="text-[#64748b] text-xs">© 2026 FixCity Inc. Secured Portal.</p>
                </div>
            </div>
        </div>
    );
}
