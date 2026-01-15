'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight, MapPin, Users, Wrench,
  Zap, BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const [stats, setStats] = useState({
    fixedToday: 0,
    activeRepairs: 0,
    volunteers: 0,
    totalReports: 0,
    totalResolved: 0,
    citiesCovered: 0,
    loading: true
  });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats/landing');
        if (res.ok) {
          const data = await res.json();
          setStats({
            ...data,
            loading: false
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0f16] text-white selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-5xl">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-xl bg-[#0a0f16]/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight">FixCity</span>
          </div>

          {/* Navigation Links Removed per user request */}

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:flex px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              Report Issue
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live: {stats.loading ? '...' : stats.fixedToday} issues resolved today
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05]">
            Reimagine <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
              Civic Engagement.
            </span>
          </h1>

          <p className="text-gray-400 text-xl md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed">
            The modern platform for smart citizens. Report issues, track progress, and watch your city transform in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/login"
              className="group relative px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg shadow-xl shadow-white/10 hover:shadow-white/20 transition-all hover:-translate-y-1"
            >
              Start Reporting
              <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 w-full"
        >
          {[
            { label: 'Total Reports', value: stats.totalReports, icon: BarChart3, color: 'text-blue-400' },
            { label: 'Active Repairs', value: stats.activeRepairs, icon: Wrench, color: 'text-amber-400' },
            { label: 'Community', value: stats.volunteers, icon: Users, color: 'text-purple-400' },
            { label: 'Cities', value: stats.citiesCovered, icon: MapPin, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors text-left group">
              <stat.icon className={`w-8 h-8 ${stat.color} mb-4 group-hover:scale-110 transition-transform`} />
              <div className="text-3xl font-bold mb-1">{stats.loading ? '-' : stat.value}</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* CTA Section */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Ready to fix your city?</h2>
          <p className="text-gray-400 text-xl mb-10">Join thousands of citizens making a difference today.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#05080c]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-lg text-white/50">FixCity</span>
          </div>

          <div className="text-gray-600 text-sm">
            &copy; 2026 FixCity Inc. Built for the future.
          </div>
        </div>
      </footer>
    </div>
  );
}
