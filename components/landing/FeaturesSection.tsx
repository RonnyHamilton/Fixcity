'use client';

import { motion } from 'framer-motion';
import { Camera, GitMerge, TrendingUp, Share2, UserCheck } from 'lucide-react';

const features = [
    {
        title: 'Instant Issue Reporting',
        description: 'Snap a photo, tag the location and report issues in seconds with AI-assisted categorization.',
        icon: Camera,
    },
    {
        title: 'Smart Duplicate Merge',
        description: 'Our AI detects if an issue has already been reported and merge it to keep the system clean.',
        icon: GitMerge,
    },
    {
        title: 'Priority Auto Escalation',
        description: 'As more citizens report the same issue, the priority level automatically escalates.',
        icon: TrendingUp,
    },
    {
        title: 'AI Merges Assigns',
        description: 'System detects duplicate & groups them drops them.',
        icon: Share2,
    },
    {
        title: 'Officer Execution',
        description: 'Appointed those is have more intervenes and technician & alerts categorization.',
        icon: UserCheck,
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } }
};

export default function FeaturesSection() {
    return (
        <section className="relative py-16 md:py-24 px-4 bg-white/50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-900 mb-3 md:mb-4 px-4"
                    >
                        Everything you need to fix a city faster.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 font-medium text-sm md:text-base px-4"
                    >
                        Report. Merge duplicates. Escalate priority. Resolve with proof.
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="flex flex-wrap justify-center gap-6 w-full">
                        {/* Top Row: 3 cards */}
                        {features.slice(0, 3).map((feature, idx) => (
                            <FeatureCard key={idx} feature={feature} />
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 w-full">
                        {/* Bottom Row: 2 cards */}
                        {features.slice(3, 5).map((feature, idx) => (
                            <FeatureCard key={idx + 3} feature={feature} />
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}

function FeatureCard({ feature }: { feature: any }) {
    return (
        <motion.div
            variants={item}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
            className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 w-full md:w-[350px] flex flex-col items-start text-left cursor-default group"
        >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>

            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2 md:mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
            </h3>

            <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                {feature.description}
            </p>
        </motion.div>
    );
}
