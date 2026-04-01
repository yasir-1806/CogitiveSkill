import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Zap, Trophy, BarChart3, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';

const features = [
  { icon: () => <Logo size={24} />, title: 'Cognitive Assessment', desc: '7 cognitive domains tested through adaptive AI-driven questions', color: '#a855f7' },
  { icon: Zap, title: 'Level-Based Unlocking', desc: 'Progress through Easy → Medium → Hard as you master each domain', color: '#c084fc' },
  { icon: Trophy, title: 'Live Leaderboard', desc: 'Compete globally and earn badges for outstanding performance', color: '#a855f7' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Radar charts and progress graphs reveal your cognitive profile', color: '#c084fc' },
  { icon: Shield, title: 'Slot Booking System', desc: 'Book test slots in advance – structured, fair and time-bound', color: '#a855f7' },
  { icon: Star, title: 'Gamified Experience', desc: 'Earn badges, track streaks and celebrate level completions', color: '#c084fc' },
];

const topics = [
  { icon: '🧠', name: 'Memory', color: '#a855f7' },
  { icon: '🔍', name: 'Logical Reasoning', color: '#a855f7' },
  { icon: '🎯', name: 'Attention', color: '#a855f7' },
  { icon: '🔮', name: 'Pattern Recognition', color: '#a855f7' },
  { icon: '⚡', name: 'Problem Solving', color: '#a855f7' },
  { icon: '📚', name: 'Verbal Ability', color: '#a855f7' },
  { icon: '⏱️', name: 'Reaction Time', color: '#a855f7' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen hero-bg" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb w-96 h-96 top-20 -left-20 opacity-10" style={{ background: 'var(--accent-primary)' }} />
        <div className="glow-orb w-80 h-80 top-40 right-0 opacity-10" style={{ background: 'var(--accent-secondary)' }} />
        <div className="glow-orb w-64 h-64 bottom-20 left-1/3 opacity-10" style={{ background: 'var(--accent-primary)' }} />
      </div>

      {/* Hero */}
      <section className="relative pt-24 pb-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 border"
              style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)', borderColor: 'rgba(168,85,247,0.3)' }}>
              <Star size={14} fill="currentColor" /> Cognitive Science Meets Technology
            </span>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-none text-white">
              Unlock Your<br /><span className="gradient-text">Cognitive Potential</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Scientifically designed assessments across 7 cognitive domains. 
              Book your slot, level up, and track your mental performance like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                  Start Assessment <ArrowRight size={20} />
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 text-lg px-8 py-4 rounded-xl font-semibold transition-all"
                  style={{ border: '2px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
                  Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[['7', 'Cognitive Domains'], ['3', 'Difficulty Levels'], ['∞', 'Potential Unlocked']].map(([val, label]) => (
              <div key={label} className="glass p-6 text-center">
                <p className="text-4xl font-black gradient-text">{val}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>7 Cognitive Domains</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Comprehensive assessment of your complete cognitive profile</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {topics.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -8 }}
                className="glass p-4 text-center cursor-pointer">
                <div className="text-3xl mb-2">{t.icon}</div>
                <p className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Why CognIQ?</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Built by cognitive scientists for real measurable improvements</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="glass p-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)' }}>
                  <f.icon size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="glass p-12" style={{ border: '1px solid rgba(168,85,247,0.2)' }}>
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Ready to Discover Your Mind?</h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Join thousands of students assessing and improving their cognitive skills every day.</p>
            <Link to="/register">
              <motion.button whileHover={{ scale: 1.05 }} className="btn-primary text-lg px-10 py-4">
                Get Started Free →
              </motion.button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {['No credit card required', 'Instant access', 'Free forever'].map(t => (
                <span key={t} className="flex items-center gap-1"><CheckCircle size={14} style={{ color: 'var(--accent-emerald)' }} />{t}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        <p>© 2024 CognIQ – Cognitive Skill Assessment Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
