'use client';

import { motion } from 'framer-motion';
import { User, GitMerge, ClipboardCheck, Wrench } from 'lucide-react';

const steps = [
    {
        title: 'Citizen Reports',
        description: 'User snaps a photo and submits via app.',
        icon: User,
        bgClass: 'bg-blue-500',
        textClass: 'text-blue-500',
        shadowClass: 'shadow-blue-500/20'
    },
    {
        title: 'AI Merges',
        description: 'System detects duplicates & groups them.',
        icon: GitMerge,
        bgClass: 'bg-purple-500',
        textClass: 'text-purple-500',
        shadowClass: 'shadow-purple-500/20'
    },
    {
        title: 'Officer Assigns',
        description: 'Officer reviews priority & alerts technician.',
        icon: ClipboardCheck,
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-500',
        shadowClass: 'shadow-emerald-500/20'
    },
    {
        title: 'Technician Fixes',
        description: 'Technician resolves issue with photo proof.',
        icon: Wrench,
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-500',
        shadowClass: 'shadow-amber-500/20'
    }
];

export default function TimelineSection() {
    return (
        <section className="relative py-24 px-4 bg-[#0a0f16] overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0a0f16] to-[#05080c] z-0" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">How FixCity Works</h2>
                    <p className="text-gray-400">From chaos to resolution in 4 simple steps.</p>
                </motion.div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.5rem] left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 w-full"
                            initial={{ x: '-100%' }}
                            whileInView={{ x: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-4 relative">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="flex flex-col items-center text-center relative"
                            >
                                {/* Step Connector Dot (Desktop) */}
                                <div className="hidden md:block absolute top-[2.25rem] w-3 h-3 rounded-full bg-[#0a0f16] border-2 border-white/20 z-10"></div>

                                {/* Icon Circle */}
                                <div className={`w-20 h-20 rounded-2xl ${step.bgClass} bg-opacity-10 flex items-center justify-center mb-6 ring-1 ring-white/10 backdrop-blur-md shadow-lg ${step.shadowClass} z-20`}>
                                    <step.icon className={`w-8 h-8 ${step.textClass}`} />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-400 px-4">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
