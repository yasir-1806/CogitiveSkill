import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Medal, Star, Crown } from 'lucide-react';

const rankIcon = (rank) => {
  if (rank === 1) return <Crown size={22} style={{ color: '#f59e0b' }} />;
  if (rank === 2) return <Medal size={22} style={{ color: '#94a3b8' }} />;
  if (rank === 3) return <Medal size={22} style={{ color: '#cd7c2f' }} />;
  return <span className="font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>#{rank}</span>;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/tests/leaderboard').then(r => setLeaderboard(r.data.leaderboard)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div></Layout>;

  const myRank = leaderboard.find(e => e.studentId?._id === user?._id);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Global Leaderboard</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Top cognitive performers worldwide</p>
      </motion.div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-center gap-4 mb-10">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
            const heights = ['h-28', 'h-36', 'h-24'];
            const colors2 = ['#94a3b8', '#f59e0b', '#cd7c2f'];
            return (
              <motion.div key={entry._id} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}
                className="text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full mb-2 flex items-center justify-center text-xl font-black"
                  style={{ background: `${colors2[i]}20`, border: `3px solid ${colors2[i]}` }}>
                  {entry.studentId?.name?.[0]?.toUpperCase()}
                </div>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{entry.studentId?.name?.split(' ')[0]}</p>
                <div className={`${heights[i]} w-20 rounded-t-xl flex flex-col items-center justify-start pt-3`}
                  style={{ background: `${colors2[i]}20`, border: `1px solid ${colors2[i]}40` }}>
                  <span className="text-xl">{i === 1 ? '🥇' : i === 0 ? '🥈' : '🥉'}</span>
                  <p className="text-sm font-bold mt-1" style={{ color: colors2[i] }}>{entry.totalScore}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* My rank banner */}
      {myRank && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mb-6 p-4 rounded-xl flex items-center gap-4"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <Star size={20} style={{ color: 'var(--accent-primary)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Your Rank: #{myRank.rank}</span>
          <span style={{ color: 'var(--text-secondary)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{myRank.totalScore} points</span>
          <span style={{ color: 'var(--text-secondary)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{myRank.testsCompleted} tests completed</span>
        </motion.div>
      )}

      {/* Full table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stat-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                {['Rank', 'Student', 'Score', 'Tests', 'Avg Score'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                const isMe = entry.studentId?._id === user?._id;
                return (
                  <motion.tr key={entry._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid var(--border-color)', background: isMe ? 'rgba(168,85,247,0.06)' : 'transparent' }}>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center w-8">{rankIcon(entry.rank)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                          style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff' }}>
                          {entry.studentId?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {entry.studentId?.name} {isMe && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.2)', color: 'var(--accent-primary)' }}>You</span>}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.studentId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-lg gradient-text">{entry.totalScore}</td>
                    <td className="px-4 py-4" style={{ color: 'var(--text-secondary)' }}>{entry.testsCompleted}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold" style={{ color: entry.averageScore >= 70 ? 'var(--accent-secondary)' : 'var(--accent-amber)' }}>
                        {Math.round(entry.averageScore || 0)}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {leaderboard.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center" style={{ color: 'var(--text-secondary)' }}>No leaderboard data yet. Be the first!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </Layout>
  );
}
