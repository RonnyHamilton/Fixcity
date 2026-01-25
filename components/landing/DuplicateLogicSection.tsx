'use client';

import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Users, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DuplicateLogicSection() {
    const [reportCount, setReportCount] = useState(1);
    const [priority, setPriority] = useState('Low');
    const [priorityColor, setPriorityColor] = useState('bg-blue-500');

    // Animation loop simulation
    useEffect(() => {
        const sequence = async () => {
            // Reset
            setReportCount(1);
            setPriority('Low');
            setPriorityColor('bg-blue-500');

            await new Promise(r => setTimeout(r, 2000));

            // Step 2
            setReportCount(3);
            setPriority('Medium');
            setPriorityColor('bg-yellow-500');

            await new Promise(r => setTimeout(r, 1500));

            // Step 3
            setReportCount(6);
            setPriority('High');
            setPriorityColor('bg-orange-500');

            await new Promise(r => setTimeout(r, 1500));

            // Step 4
            setReportCount(8);
            setPriority('Critical');
            setPriorityColor('bg-red-500');

            await new Promise(r => setTimeout(r, 3000));
        };

        const interval = setInterval(() => {
            sequence();
        }, 9000); // Loop every 9s

        sequence(); // Start immediately

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 px-4 bg-[#0a0f16] relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

                {/* Text Side */}
                <div className="flex-1 text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-6">
                            Smart Deduplication Engine
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            One issue. <br />
                            Multiple reports. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                Higher Urgency.
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 mb-8 max-w-lg">
                            Even if 10 citizens report the same garbage pile, officers see only ONE issue — with escalated priority.
                        </p>

                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" /> Low Priority
                            </span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" /> Critical Priority
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Visual Side - Animated Card */}
                <div className="flex-1 w-full max-w-md">
                    <div className="relative">
                        {/* Background glow pulse based on priority */}
                        <motion.div
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`absolute inset-0 ${priorityColor} blur-[80px] opacity-20`}
                        />

                        <div className="relative bg-[#11161d] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
                                        <AlertTriangle className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Pot hole on 5th Ave</h3>
                                        <p className="text-xs text-gray-400">Reported 10m ago • New York, NY</p>
                                    </div>
                                </div>
                                {/* Animated Priority Badge */}
                                <motion.div
                                    key={priority}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white transition-colors duration-500 ${priorityColor}`}
                                >
                                    {priority}
                                </motion.div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="h-32 bg-gray-800/50 rounded-xl mb-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-74.006,40.7128,13,0/600x300?access_token=INSERT_TOKEN')] bg-cover opacity-50" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                            </div>

                            {/* Counter Section */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400 text-sm">Reports Merged</span>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <motion.span
                                        key={reportCount}
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="text-2xl font-bold text-white"
                                    >
                                        {reportCount}
                                    </motion.span>
                                </div>
                            </div>
                        </div>

                        {/* Report incoming simulation cards behind */}
                        <motion.div
                            animate={reportCount > 1 ? { scale: 0.95, y: 10, opacity: 0.5 } : { opacity: 0 }}
                            className="absolute inset-0 bg-white/5 rounded-3xl -z-10 translate-y-4 scale-95"
                        />
                        <motion.div
                            animate={reportCount > 3 ? { scale: 0.9, y: 20, opacity: 0.3 } : { opacity: 0 }}
                            className="absolute inset-0 bg-white/5 rounded-3xl -z-20 translate-y-8 scale-90"
                        />

                    </div>
                </div>

            </div>
        </section>
    );
}
