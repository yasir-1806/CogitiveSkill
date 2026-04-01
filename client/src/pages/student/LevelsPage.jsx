import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Unlock, ChevronRight, Clock, Target, Star, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';

const diffColors = { easy: 'var(--accent-secondary)', medium: 'var(--accent-amber)', hard: 'var(--accent-rose)' };

export default function LevelsPage() {
  const { topicId } = useParams();
  const [levels, setLevels] = useState([]);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lRes, tRes] = await Promise.all([api.get(`/levels/${topicId}`), api.get('/topics')]);
        setLevels(lRes.data.levels);
        const t = tRes.data.topics.find(t => t._id === topicId);
        setTopic(t);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [topicId]);

  const handleSelectLevel = (level) => {
    if (!level.isUnlocked || level.isCompleted) return;
    navigate('/book-slot', { state: { topicId, levelId: level._id, topicName: topic?.topicName, level } });
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{topic?.icon}</span>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{topic?.topicName}</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Select a level to book a test slot</p>
      </motion.div>

      <div className="max-w-2xl space-y-4">
        {levels.map((level, i) => (
          <motion.div key={level._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSelectLevel(level)}
            className={`stat-card flex items-center gap-5 ${level.isUnlocked ? 'cursor-pointer' : 'level-locked cursor-not-allowed'}`}
            whileHover={level.isUnlocked ? { x: 6 } : {}}
            style={{ borderColor: level.isUnlocked ? 'rgba(168,85,247,0.3)' : 'var(--border-color)' }}
          >
            {/* Level number */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 relative overflow-hidden`}
              style={{ background: level.isCompleted ? 'rgba(168,85,247,0.2)' : level.isUnlocked ? 'rgba(168,85,247,0.1)' : 'rgba(100,100,100,0.05)',
                color: level.isCompleted || level.isUnlocked ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
              {level.isCompleted ? <CheckCircle size={28} /> : level.isUnlocked ? level.levelNumber : <Lock size={20} />}
              {level.isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-[var(--accent-primary)]/10" />}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg" style={{ color: level.isCompleted ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{level.title}</h3>
                <span className={`badge badge-${level.difficulty}`}>{level.difficulty}</span>
                {level.isCompleted && <span className="badge badge-easy" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)' }}>Completed</span>}
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{level.description}</p>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><Clock size={12} /> {Math.round(level.timeLimit / 60)} min limit</span>
                <span className="flex items-center gap-1"><Target size={12} /> Pass at {level.passingScore}%</span>
              </div>
            </div>

            {level.isUnlocked ? (
              <ChevronRight size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            ) : (
              <Lock size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            )}
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
