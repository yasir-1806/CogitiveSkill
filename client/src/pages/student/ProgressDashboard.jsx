import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import ProgressBar from '../../components/ProgressBar';
import api from '../../services/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, Star, BrainCircuit } from 'lucide-react';
import Logo from '../../components/Logo';

const colors = ['var(--accent-primary)', 'var(--accent-secondary)', '#d946ef', '#f472b6', '#fb7185', '#818cf8'];

export default function ProgressDashboard() {
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tests/progress'), api.get('/tests/results')])
      .then(([pr, re]) => { setProgress(pr.data.progress); setResults(re.data.results); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const radarData = progress.map(p => ({ subject: p.topicId?.topicName || 'Topic', A: p.bestScore || 0, fullMark: 100 }));
  const barData = progress.map((p, i) => ({ name: p.topicId?.topicName || 'Topic', score: p.bestScore || 0, color: colors[i % colors.length] }));

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Progress Dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Track your cognitive skill development over time</p>
      </motion.div>

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

      {/* Progress per topic */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stat-card mb-6">
        <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>Topic Progress</h2>
        {progress.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No tests completed yet. Start your first assessment!</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {progress.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{p.topicId?.icon}</span>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.topicId?.topicName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {p.levelsCompleted?.length || 0} levels completed · {p.totalAttempts || 0} total attempts
                    </p>
                  </div>
                </div>
                <ProgressBar value={p.bestScore || 0} max={100} color={colors[i % colors.length]} label="Best Score" />
                
                {/* Level Attempts Breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {Array.from({ length: p.topicId?.totalLevels || 3 }).map((_, idx) => {
                    const levelNum = idx + 1;
                    const levelAttempts = p.attemptsPerLevel?.[levelNum] || 0;
                    const isCompleted = (p.levelsCompleted?.length || 0) > idx;

                    return (
                      <div key={idx} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <p className="text-[10px] uppercase tracking-tighter opacity-50 mb-1">Lvl {levelNum}</p>
                        <div className="flex items-center justify-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}`} />
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{levelAttempts}</span>
                        </div>
                        <p className="text-[9px] opacity-40 mt-0.5">attempts</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2">
                  {Array.from({ length: p.topicId?.totalLevels || 3 }).map((_, idx) => (
                    <div key={idx} className="flex-1 h-1.5 rounded-full" style={{
                      background: (p.levelsCompleted?.length || 0) > idx ? colors[i % colors.length] : 'rgba(100,100,100,0.1)'
                    }} />
                  ))}
                </div>
                <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Status: {(p.levelsCompleted?.length || 0)}/{p.topicId?.totalLevels || 3} levels mastered
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
