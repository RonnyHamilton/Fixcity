'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  ArrowRight, MapPin, Users, Wrench,
  Zap, BarChart3
} from 'lucide-react';
import HeroVideo from '@/components/HeroVideo';

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

      {/* Background Atmosphere - Premium Grid & Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen" />

        {/* Animated Cyber Grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(to right, #4f4f4f2e 1px, transparent 1px), linear-gradient(to bottom, #4f4f4f2e 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
          }}
        />

        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('/noise.svg')] mix-blend-overlay"></div>
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-5xl">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-xl bg-[#0a0f16]/80 ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 ring-2 ring-primary/20">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">FixCity</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:flex px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium hover:border-white/20 active:scale-95"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 border border-primary/50 relative overflow-hidden group"
            >
              <span className="relative z-10">Report Issue</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Cinematic Split Layout */}
      <section className="relative h-screen min-h-[800px] flex items-center overflow-hidden">
        {/* Absolute Video Background */}
        <HeroVideo
          srcMp4="/hero/Animate_this_fixcity_1080p_202601162141.mp4"
          variant="background"
          className="z-0"
        />

        {/* Cinematic Gradient Overlays - Optimized for Left-Aligned Text */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#05080c] via-[#05080c]/60 to-transparent" /> {/* Strong left fade */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#05080c] via-transparent to-black/40" /> {/* Bottom blend */}

        {/* Hero Content - Left Aligned */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 pt-20">
          <div className="max-w-3xl">
            {/* Live Badge - Floating Glass */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative inline-flex mb-8 group"
            >
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-emerald-300 text-sm font-semibold backdrop-blur-xl shadow-lg ring-1 ring-white/5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]"></span>
                </span>
                <span className="tracking-wide">Live: {stats.loading ? '...' : stats.fixedToday} issues resolved today</span>
              </div>
            </motion.div>

            {/* Main Heading - Massive & Impactful */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-8 leading-[0.95] text-white"
            >
              Fix Your City. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-300 to-emerald-300 animate-gradient-x drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                In Real Time.
              </span>
            </motion.h1>

            {/* Subtitle - Readable & Clean */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-2xl text-gray-300 mb-10 leading-relaxed max-w-xl font-light border-l-2 border-white/20 pl-6"
            >
              The AI-powered platform for smart citizens. Report issues instantly, track repairs live, and earn rewards for improving your community.
            </motion.p>

            {/* CTA Buttons - Removed as per request (redundant with navbar) */}
            <div className="mb-10"></div>

            {/* Stats / Feature Chips - Minimalist Row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              {[
                { label: 'Verified by AI', value: '100%', color: 'bg-blue-500' },
                { label: 'Avg. Fix Time', value: '24h', color: 'bg-emerald-500' },
                { label: 'Active Cities', value: '12+', color: 'bg-purple-500' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#0a0f16]/60 border border-white/5 backdrop-blur-md hover:border-white/20 transition-colors cursor-default group"
                >
                  <div className={`w-2 h-2 rounded-full ${stat.color} shadow-[0_0_10px_currentColor] group-hover:scale-150 transition-transform`} />
                  <div className="flex flex-col leading-none">
                    <span className="text-white font-bold text-lg">{stat.value}</span>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll Indicator - Bottom Right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-12 right-12 z-20 hidden md:flex"
          >
            <div className="flex flex-col items-center gap-4">
              <span className="text-white/20 text-xs font-bold tracking-[0.3em] uppercase [writing-mode:vertical-rl] rotate-180">Scroll to explore</span>
              <div className="h-16 w-px bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Subtle Divider */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        </div>
      </div>

      {/* Main Content Section (Below Video) */}
      <section className="relative z-10 py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards - Holographic Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { label: 'Total Reports', value: stats.totalReports, icon: BarChart3, color: 'text-blue-400', from: 'from-blue-500/20', delay: 0.4 },
              { label: 'Active Repairs', value: stats.activeRepairs, icon: Wrench, color: 'text-amber-400', from: 'from-amber-500/20', delay: 0.5 },
              { label: 'Community', value: stats.volunteers, icon: Users, color: 'text-purple-400', from: 'from-purple-500/20', delay: 0.6 },
              { label: 'Cities', value: stats.citiesCovered, icon: MapPin, color: 'text-emerald-400', from: 'from-emerald-500/20', delay: 0.7 },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: stat.delay }}
                className="relative overflow-hidden p-8 rounded-3xl border border-white/5 bg-[#0a0f16]/40 backdrop-blur-xl group hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]"
              >
                {/* Card Glow Effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.from} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -mr-10 -mt-10 rounded-full`}></div>
                <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-3xl transition-colors duration-500"></div>

                <div className="relative z-10">
                  <div className="mb-4 inline-flex p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-4xl font-bold mb-2 tracking-tight">{stats.loading ? '-' : stat.value}</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Ready to fix your city?</h2>
            <p className="text-gray-400 text-xl mb-10">Join thousands of citizens making a difference today.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
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
