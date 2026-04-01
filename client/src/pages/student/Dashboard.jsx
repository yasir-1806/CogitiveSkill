import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Trophy, TrendingUp, ArrowRight, Clock, CheckCircle, BrainCircuit } from 'lucide-react';
import Logo from '../../components/Logo';
import Layout from '../../components/Layout';
import StatsWidget from '../../components/StatsWidget';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pr, re, bo] = await Promise.all([
          api.get('/tests/progress'), api.get('/tests/results'), api.get('/bookings/my'),
        ]);
        setProgress(pr.data.progress); setResults(re.data.results); setBookings(bo.data.bookings);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const totalTests = results.length;
  const passedTests = results.filter(r => r.completionStatus === 'passed').length;
  const avgScore = results.length ? Math.round(results.reduce((a, b) => a + b.percentage, 0) / results.length) : 0;
  const upcomingBookings = bookings.filter(b => b.bookingStatus === 'confirmed').length;

  const barData = progress.map((p, i) => ({
    name: p.topicId?.topicName?.split(' ')[0] || 'Topic',
    score: p.bestScore || 0,
    color: ['var(--accent-primary)', 'var(--accent-secondary)', '#d946ef', '#f472b6', '#fb7185', '#818cf8'][i % 6]
  }));

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Track your cognitive performance and level up</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsWidget icon={BookOpen} label="Tests Taken" value={totalTests} color="var(--accent-primary)" delay={0} />
        <StatsWidget icon={CheckCircle} label="Tests Passed" value={passedTests} color="var(--accent-secondary)" sub={`${totalTests ? Math.round(passedTests/totalTests*100) : 0}% pass rate`} delay={0.1} />
        <StatsWidget icon={TrendingUp} label="Avg Score" value={`${avgScore}%`} color="var(--accent-primary)" delay={0.2} />
        <StatsWidget icon={Calendar} label="Upcoming Slots" value={upcomingBookings} color="var(--accent-secondary)" delay={0.3} />
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card mb-8">
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { to: '/topics', icon: BrainCircuit, label: 'Browse Topics', sub: 'Choose your challenge', color: 'var(--accent-primary)' },
            { to: '/book-slot', icon: Calendar, label: 'Book a Slot', sub: 'Schedule your test', color: 'var(--accent-secondary)' },
            { to: '/progress', icon: TrendingUp, label: 'View Progress', sub: 'See your growth', color: 'var(--accent-primary)' },
            { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', sub: 'Check rankings', color: 'var(--accent-secondary)' },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={to} to={to}>
              <motion.div whileHover={{ y: -4 }} className="flex items-center gap-3 p-4 rounded-2xl transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color.includes('var') ? 'rgba(168,85,247,0.1)' : `${color}20`, color }}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Results */}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stat-card">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Topic', 'Level', 'Score', 'Status', 'Date'].map(h => (
                    <th key={h} className="pb-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 5).map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span>{r.topicId?.icon}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{r.topicId?.topicName}</span>
                      </div>
                    </td>
                    <td className="py-3" style={{ color: 'var(--text-secondary)' }}>Level {r.levelId?.levelNumber}</td>
                    <td className="py-3 font-bold" style={{ color: r.percentage >= 70 ? 'var(--accent-primary)' : 'var(--accent-amber)' }}>{r.percentage}%</td>
                    <td className="py-3">
                      <span className={`badge badge-${r.completionStatus === 'passed' ? 'easy' : 'hard'}`}>
                        {r.completionStatus}
                      </span>
                    </td>
                    <td className="py-3" style={{ color: 'var(--text-secondary)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Bar chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card mb-8">
        <h2 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-secondary)' }} /> Best Scores by Topic
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={false}
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-secondary)' }}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </Layout>
  );
}

