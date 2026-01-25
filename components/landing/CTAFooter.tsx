'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, Play } from 'lucide-react';

export default function CTAFooter() {
    return (
        <footer className="relative bg-[#05080c] pt-24 pb-12 overflow-hidden">

            {/* Animated Gradient Border Top */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">

                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
                >
                    Ready to report <br />
                    your first issue?
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
                >
                    <Link
                        href="/login"
                        className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.7)] flex items-center gap-2"
                    >
                        Start Reporting
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                        href="/demo"
                        className="px-8 py-4 rounded-full bg-transparent border border-white/10 hover:bg-white/5 text-white font-medium text-lg transition-all flex items-center gap-2 group"
                    >
                        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <Play className="w-3 h-3 fill-current" />
                        </span>
                        View Demo
                    </Link>
                </motion.div>

                {/* Footer Links (Minimal) */}
                <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-white/50">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">FixCity</span>
                    </div>
                    <div className="text-sm text-gray-600">
                        © 2026 FixCity Inc. All rights reserved.
                    </div>
                </div>

            </div>
        </footer>
    );
}
