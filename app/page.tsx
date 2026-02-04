'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';

import FeaturesSection from '@/components/landing/FeaturesSection';
import TimelineSection from '@/components/landing/TimelineSection';
import DuplicateLogicSection from '@/components/landing/DuplicateLogicSection';
import CTAFooter from '@/components/landing/CTAFooter';

export default function LandingPage() {
  const [stats, setStats] = useState({ fixedToday: 124, loading: false });

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

      {/* Navbar - Floating Pill with Slide Down */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-slate-200/50 rounded-full px-6 py-3 flex items-center justify-between gap-12 min-w-[320px] md:min-w-[600px]"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">FixCity</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-blue-300">
              Report Issue
            </Link>
          </div>
        </motion.nav>
      </div>

      {/* Hero Section - Full Width Background Image */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Full Background Image */}
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            src="/hero/hero_v5.png"
            alt="Citizen reporting civic issues"
            className="w-full h-full object-cover object-right"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-xl py-20"
          >
            {/* Live Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-xs font-semibold text-slate-600 mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live: {stats.fixedToday} issues resolved today
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
              Fix Your City. <br />
              Civic Reporting, <br />
              <span className="text-slate-400">Simplified.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg text-slate-600 mb-10 leading-relaxed max-w-sm font-medium">
              The official platform for reporting urban issues and improving civic life in India.
            </motion.p>

            <motion.div variants={itemVariants}>
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-200/50 transition-all hover:scale-105 hover:-translate-y-1">
                Start Reporting
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column (Image is in background) */}
          <div className="hidden lg:block"></div>
        </div>
      </section>

      {/* Feature Sections */}
      <FeaturesSection />

      <TimelineSection />

      <DuplicateLogicSection />

      <CTAFooter />

    </div>
  );
}
