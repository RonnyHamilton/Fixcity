'use client';

import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import Image from 'next/image';

export default function DuplicateLogicSection() {
    return (
        <section className="relative py-0 bg-slate-900 overflow-hidden">

            <div className="grid lg:grid-cols-2 min-h-[600px]">

                {/* Left: Street Image */}
                <div className="relative h-[400px] lg:h-full w-full bg-black group overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 z-10" />
                    <motion.img
                        initial={{ scale: 1.1 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 1.5 }}
                        src="/hero/pothole_box.jpg"
                        alt="Damaged Street with AI Box"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                    />

                    <div className="absolute inset-0 z-20 flex flex-col justify-center px-10 lg:px-20 text-white pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white/10 backdrop-blur-md self-start px-3 py-1 text-xs uppercase tracking-wider font-bold rounded mb-4 border border-white/20"
                        >
                            Smart Deduplication Engine
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            viewport={{ once: true }}
                            className="text-4xl lg:text-5xl font-bold mb-6"
                        >
                            Efficient Issue Resolution
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            viewport={{ once: true }}
                            className="text-lg text-white/90 max-w-md leading-relaxed shadow-sm block"
                        >
                            Even if 10 citizens report the same garbage pile, officers see only ONE issue — with escalated priority.
                        </motion.p>
                    </div>
                </div>

                {/* Right: Map Section (Light) */}
                <div className="relative bg-[#fcfcfc] flex items-center justify-center p-10 lg:p-20">
                    {/* Map Background Pattern */}
                    <div className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Search Bar - Decorative */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-10 left-10 right-10 flex gap-4 pointer-events-none select-none opacity-50 lg:opacity-100"
                    >
                        <div className="flex-1 bg-white rounded-full shadow-sm border border-slate-200 px-6 py-4 flex items-center gap-3 text-slate-400 text-sm">
                            <Search className="w-4 h-4" />
                            <span>Civic map</span>
                        </div>
                    </motion.div>

                    {/* Main Map Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        transition={{ duration: 0.6, type: 'spring' }}
                        className="relative bg-white rounded-3xl p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 w-full max-w-md"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-slate-400"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Pothole on MG Road</h3>
                                    <p className="text-xs text-slate-400">Reported 10m ago • Bengaluru, Karnataka</p>
                                </div>
                            </div>
                            <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase"
                            >
                                Critical
                            </motion.span>
                        </div>

                        {/* Map Visual */}
                        <div className="h-40 bg-blue-50/50 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border border-blue-100 group-hover:border-blue-200 transition-colors">
                            {/* Abstract Map Elements */}
                            <div className="absolute top-0 bottom-0 left-[30%] w-8 bg-white -skew-x-12 opacity-50" />
                            <div className="absolute top-[40%] left-0 right-0 h-8 bg-white skew-y-6 opacity-50" />

                            <div className="relative z-10">
                                <div className="animate-ping absolute -inset-4 rounded-full bg-red-400 opacity-30"></div>
                                <div className="relative w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center text-sm font-medium text-slate-600 border border-slate-100">
                            <span>Reports Merged</span>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ x: -10, opacity: 0 }}
                                            whileInView={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"
                                        />
                                    ))}
                                </div>
                                <span className="font-bold text-slate-900">+5</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
