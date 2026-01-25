'use client';

import { motion } from 'framer-motion';
import { Camera, GitMerge, TrendingUp, UserCheck, Image as ImageIcon, Activity } from 'lucide-react';

const features = [
    {
        title: 'Instant Issue Reporting',
        description: 'Snap a photo, tag the location, and report issues in seconds with AI-assisted categorization.',
        icon: Camera,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'group-hover:border-blue-500/50'
    },
    {
        title: 'Smart Duplicate Merge',
        description: 'Our AI detects if an issue has already been reported and merges it to keep the system clean.',
        icon: GitMerge,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'group-hover:border-purple-500/50'
    },
    {
        title: 'Priority Auto Escalation',
        description: 'As more citizens report the same issue, the priority level automatically escalates.',
        icon: TrendingUp,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        title: 'Officer Workflow',
        description: 'Streamlined dashboard for officers to assign technicians and track resolution progress.',
        icon: UserCheck,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'group-hover:border-emerald-500/50'
    },
    {
        title: 'Resolution Proof',
        description: 'Technicians must upload photo proof and resolution notes to close an issue.',
        icon: ImageIcon,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'group-hover:border-amber-500/50'
    },
    {
        title: 'Live Citizen Status',
        description: 'Track your report status in real-time from Pending to In Progress to Resolved.',
        icon: Activity,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'group-hover:border-cyan-500/50'
    }
];

export default function FeaturesSection() {
    return (
        <section className="relative py-24 px-4 md:px-8 bg-[#0a0f16]">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Everything you need to fix a city faster.
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Report. Merge duplicates. Escalate priority. Resolve with proof.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`group relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden ${feature.border}`}
                        >
                            {/* Hover Glow Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 flex flex-col items-start gap-4">
                                <div className={`p-4 rounded-xl ${feature.bg} ${feature.color} ring-1 ring-white/10`}>
                                    <feature.icon className="w-8 h-8" />
                                </div>

                                <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                                    {feature.title}
                                </h3>

                                <p className="text-gray-400 leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Decorative Corner Glow */}
                            <div className={`absolute top-0 right-0 w-24 h-24 ${feature.bg} blur-2xl -mr-12 -mt-12 opacity-50`} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
