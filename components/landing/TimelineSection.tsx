'use client';

import { motion } from 'framer-motion';
import { User, GitMerge, UserCheck, Wrench, CheckCircle } from 'lucide-react';

const steps = [
    {
        title: 'Citizen Reports',
        description: 'User snaps a photo and submits on app.',
        icon: User,
    },
    {
        title: 'System Merges',
        description: 'System detects duplicates & groups them.',
        icon: GitMerge,
    },
    {
        title: 'Officer Assigns',
        description: 'Officer reviews priority & alerts technician.',
        icon: UserCheck,
    },
    {
        title: 'Technician Fixes',
        description: 'Technician resolves issue with photo proof.',
        icon: Wrench,
    }
];

export default function TimelineSection() {
    return (
        <section className="py-24 px-4 bg-[#fffdf9] overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold text-slate-900 mb-4"
                    >
                        How FixCity Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500"
                    >
                        From chaos to resolution in 4 simple steps.
                    </motion.p>
                </div>

                <div className="relative pt-10">
                    {/* Connecting Line Container */}
                    <div className="absolute top-[4.5rem] left-[12%] right-[12%] h-0.5 bg-slate-100 -z-10 hidden md:block overflow-hidden">
                        {/* Progressive Line Draw */}
                        <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                            className="h-full bg-blue-200"
                        />

                        {/* Moving Particle - Infinite Loop */}
                        <motion.div
                            animate={{ left: ["-10%", "110%"] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1 }}
                            className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.3, type: "spring", bounce: 0.4 }}
                                className="flex flex-col items-center text-center relative group"
                            >
                                {/* Icon Square */}
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-16 h-16 rounded-xl text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-100 z-10 relative transition-colors duration-300"
                                    style={{ backgroundColor: '#5b7c99' }}
                                >
                                    <step.icon className="w-8 h-8" />

                                    {/* Pulse Ring */}
                                    <motion.div
                                        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                                        className="absolute inset-0 rounded-xl bg-[#5b7c99] -z-10"
                                    />
                                </motion.div>

                                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                                <p className="text-xs text-slate-500 max-w-[180px] leading-relaxed">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
