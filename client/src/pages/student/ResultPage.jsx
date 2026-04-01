import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, RotateCcw, Home, Clock, Star, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { result, questions, selectedAnswers } = state || {};
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (result?._id) {
      fetchAiInsight();
    }
  }, [result?._id]);

  const fetchAiInsight = async () => {
    setLoadingAi(true);
    try {
      const res = await api.post('/ai/performance-insights', { resultId: result._id });
      setAiInsight(res.data.insight);
    } catch (e) {
      console.error('Failed to fetch AI insight:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  if (!result) { navigate('/dashboard'); return null; }

  const { score, maxScore, percentage, completionStatus, timeTaken, badges, attemptNumber } = result;
  const passed = completionStatus === 'passed';

  const formatTime = (s) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-bg py-10">
      <div className="max-w-2xl w-full space-y-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-10 text-center">
          <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center flex-col"
            style={{ 
              background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              border: `3px solid ${passed ? '#10b981' : '#f43f5e'}` 
            }}>
            {passed ? <Trophy size={40} className="text-emerald-500" /> : <XCircle size={40} className="text-rose-500" />}
            <p className="text-2xl font-black mt-1" style={{ color: passed ? '#10b981' : '#f43f5e' }}>{percentage}%</p>
          </div>

          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
            {passed ? 'Level Cleared!' : 'Keep Practicing'}
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            {passed ? 'Great job mastering this level.' : 'Review your errors and try again to improve.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Score', value: `${score}/${maxScore}`, color: 'var(--accent-primary)' },
              { label: 'Attempt', value: `#${attemptNumber || 1}`, color: 'var(--accent-secondary)' },
              { label: 'Percentage', value: `${percentage}%`, color: passed ? '#10b981' : '#f43f5e' },
              { label: 'Time', value: formatTime(timeTaken), color: '#f59e0b' },
            ].map(k => (
              <div key={k.label} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] uppercase opacity-50 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mb-8 p-5 rounded-2xl text-left"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-indigo-400">
              <Sparkles size={14} /> AI Performance Insights
            </h3>
            {loadingAi ? (
              <p className="text-sm opacity-50 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Analyzing...</p>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{aiInsight || 'AI analysis is unavailable for this attempt.'}</p>
            )}
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary px-8 py-3 flex items-center justify-center gap-2">
              <Home size={18} /> Dashboard
            </button>
            <button onClick={() => navigate('/topics')} className="btn-primary px-8 py-3 flex items-center justify-center gap-2">
              <BookOpen size={18} /> Explore Topics
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
