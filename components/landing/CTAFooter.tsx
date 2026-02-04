'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function CTAFooter() {
    return (
        <footer className="pt-16 md:pt-32 pb-12 md:pb-16 bg-white text-center">
            <div className="max-w-4xl mx-auto px-4 md:px-6">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-slate-900 mb-8 md:mb-12 tracking-tight"
                >
                    Ready to report <br />
                    your first issue?
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 md:mb-24"
                >
                    <Link
                        href="/login"
                        className="px-6 md:px-8 py-3.5 md:py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base md:text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        Start Reporting
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                </motion.div>

                <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-8">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <span className="font-bold text-slate-800">FixCity</span>
                    </div>
                    <div>
                        © 2026 FixCity Inc. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
