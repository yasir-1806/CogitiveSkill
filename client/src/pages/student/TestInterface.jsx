import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Send, PlayCircle, Target } from 'lucide-react';
import api from '../../services/api';

export default function TestInterface() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [originalLimit, setOriginalLimit] = useState(600);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchActiveBooking();
    
    const handleFullscreenChange = () => {
      if (started && !document.fullscreenElement) {
        setFullscreenWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [started]);

  // Main Test Timer Effect
  useEffect(() => {
    if (!started || submitting || timeLeft <= 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          clearInterval(timerRef.current); 
          if (!submitting) handleSubmit(true); 
          return 0; 
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started, submitting]);

  // Prep-screen Dynamic Countdown (for restricted slots)
  useEffect(() => {
    if (started || loading || !booking || timeLeft >= originalLimit) return;
    
    const prepTimer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    
    return () => clearInterval(prepTimer);
  }, [started, loading, booking, timeLeft, originalLimit]);

  const fetchActiveBooking = async () => {
    try {
      const res = await api.get('/bookings/active');
      let active = res.data.activeBooking;

      // Fallback: if backend active endpoint returns null, pick today's nearest valid booking from /my.
      if (!active) {
        const myRes = await api.get('/bookings/my');
        const bookings = Array.isArray(myRes.data?.bookings) ? myRes.data.bookings : [];
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const todays = bookings
          .filter((b) => b?.bookingStatus === 'confirmed' && b?.slotId?.date === todayStr)
          .sort((a, b) => (a.slotId?.startTime || '').localeCompare(b.slotId?.startTime || ''));

        const inWindow = todays.find((b) => currentTime >= b.slotId.startTime && currentTime <= b.slotId.endTime);
        const upcoming = todays.find((b) => currentTime < b.slotId.endTime);
        active = inWindow || upcoming || null;
      }

      if (!active) {
        setError('No active booking found. Please book a slot first.');
        setLoading(false);
        return;
      }

      setBooking(active);
      setTimeLeft(active.dynamicTimeLimit ?? active.levelId.timeLimit);
      setOriginalLimit(active.originalTimeLimit ?? active.levelId.timeLimit);
    } catch (e) {
      setError('Could not find an active booking.');
    } finally { setLoading(false); }
  };

  const handleStart = async () => {
    try {
      const res = await api.post('/tests/start', { bookingId: booking._id });
      const fetchedQuestions = Array.isArray(res.data.questions) ? res.data.questions.filter(Boolean) : [];
      if (!fetchedQuestions.length) {
        setError('No questions are available for this test yet. Please contact admin.');
        return;
      }
      setQuestions(fetchedQuestions);
      // Use the server limit as the "ground truth" but allow current timeLeft to stay if it's already lower
      // (meaning they spent time on the prep screen)
      const serverLimit = res.data.timeLimit;
      setTimeLeft(t => Math.min(t, serverLimit));
      setOriginalLimit(res.data.originalTimeLimit || serverLimit);
      startTimeRef.current = Date.now();
      
      // Request Fullscreen
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn("Fullscreen request failed", err);
      }

      setStarted(true);
    } catch (e) { setError(e.response?.data?.message || 'Cannot start test at this time'); }
  };

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    if (!auto && !confirmSubmit) {
      setConfirmSubmit(true);
      return;
    }
    setConfirmSubmit(false);
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      const answersArr = questions.map((_, i) => answers[i] !== undefined ? answers[i] : -1);
      const res = await api.post('/tests/submit', { bookingId: booking._id, answers: answersArr, timeTaken });
      navigate('/result', { state: { result: res.data.result, questions: res.data.questions, selectedAnswers: res.data.selectedAnswers } });
    } catch (e) { setError(e.response?.data?.message || 'Submission failed'); setSubmitting(false); }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !started) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass p-10 text-center max-w-md">
        <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-amber)' }} />
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>No Active Slot</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => navigate('/book-slot')} className="btn-primary px-6 py-2">Book a Slot</button>
      </motion.div>
    </div>
  );

  if (!started) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-10 text-center max-w-lg">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center relative overflow-hidden" style={{ border: '2px solid rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))' }} />
          <span className="text-3xl relative z-10" style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 5px var(--accent-primary))' }}>{booking?.topicId?.icon}</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 gradient-text">{booking?.topicId?.topicName}</h2>
        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{booking?.levelId?.title}</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Slot: {booking?.slotId?.startTime} – {booking?.slotId?.endTime}
        </p>
        <div className="p-6 rounded-2xl mb-8 relative overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
           {!booking?.isPresent && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
               className="mb-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 justify-center" 
               style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
               <AlertTriangle size={14} /> Attendance not yet verified by Admin
             </motion.div>
           )}

           <div className="flex items-center justify-center gap-6 text-sm">
             <div className="text-center">
               <p className="font-bold text-xl gradient-text" style={{ color: timeLeft < originalLimit ? '#f43f5e' : 'var(--accent-primary)' }}>
                 {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
               </p>
               <p style={{ color: 'var(--text-secondary)' }}>Available Time</p>
             </div>
             <div className="w-px h-10 bg-[var(--border-color)] opacity-50" />
             <div className="text-center">
               <p className="font-bold text-xl gradient-text">{booking?.levelId?.passingScore}%</p>
               <p style={{ color: 'var(--text-secondary)' }}>To Pass</p>
             </div>
           </div>
           <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
             Ensure you have a stable internet connection. The timer will start immediately upon clicking the button below.
           </p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05, shadow: '0 0 20px rgba(168,85,247,0.4)' }} 
          whileTap={{ scale: 0.95 }}
          onClick={handleStart} 
          className="btn-primary text-lg px-10 py-4 w-full flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
          <PlayCircle size={22} />
          Start Assessment
        </motion.button>
      </motion.div>
    </div>
  );

  const q = questions[current];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {fullscreenWarning && <FullscreenWarningOverlay onReturn={() => setFullscreenWarning(false)} />}
      {confirmSubmit && (
        <SubmitConfirmation 
          onCancel={() => setConfirmSubmit(false)} 
          onConfirm={() => handleSubmit(true)} 
          loading={submitting} 
          answered={answeredCount} 
          total={questions.length} 
        />
      )}
      {/* Top bar */}
      <div className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{booking?.topicId?.icon}</span>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{booking?.topicId?.topicName}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{booking?.levelId?.title}</p>
          </div>
        </div>

        {/* Timer & Pass Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <Target size={14} /> Min {booking?.levelId?.passingScore}% to Pass
          </div>
          <motion.div animate={{ scale: timeLeft <= 30 ? [1, 1.1, 1] : 1 }} transition={{ repeat: Infinity, duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg"
            style={{ background: timeLeft <= 60 ? 'rgba(244,63,94,0.15)' : 'var(--bg-card)', color: timeLeft <= 60 ? '#f43f5e' : 'var(--text-primary)', border: `1px solid ${timeLeft <= 60 ? 'rgba(244,63,94,0.3)' : 'var(--border-color)'}` }}>
            <Clock size={18} /> {formatTime(timeLeft)}
          </motion.div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{answeredCount}/{questions.length}</span>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm btn-primary">
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit'}
          </motion.button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1" style={{ background: 'var(--bg-secondary)' }}>
        <motion.div animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
          className="h-full" style={{ background: 'var(--accent-primary)', boxShadow: '0 0 10px rgba(168,85,247,0.5)' }} />
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Question dots */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="w-9 h-9 rounded-lg text-sm font-bold transition-all"
              style={{
                background: i === current ? 'var(--accent-primary)' : answers[i] !== undefined ? 'rgba(168,85,247,0.15)' : 'var(--bg-card)',
                color: i === current ? '#fff' : answers[i] !== undefined ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: `1px solid ${i === current ? 'var(--accent-primary)' : answers[i] !== undefined ? 'rgba(168,85,247,0.3)' : 'var(--border-color)'}`,
              }}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="glass p-8 mb-6">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 relative overflow-hidden"
                style={{ border: '2px solid rgba(168,85,247,0.4)' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))' }} />
                <span className="relative z-10" style={{ color: 'var(--text-primary)' }}>{current + 1}</span>
              </div>
              <p className="text-lg font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q?.questionText}</p>
            </div>
            <div className="space-y-3">
              {q?.options?.map((opt, oi) => (
                <motion.button key={oi} whileHover={{ x: 4 }} onClick={() => setAnswers(a => ({ ...a, [current]: oi }))}
                  className={`option-btn ${answers[current] === oi ? 'selected' : ''}`}>
                  <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-sm mr-3" 
                    style={{ background: answers[current] === oi ? 'rgba(168,85,247,0.2)' : 'var(--bg-secondary)', color: answers[current] === oi ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', opacity: current === 0 ? 0.4 : 1 }}>
            <ChevronLeft size={18} /> Previous
          </motion.button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Question {current + 1} of {questions.length}</span>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', opacity: current === questions.length - 1 ? 0.4 : 1 }}>
            Next <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function SubmitConfirmation({ onCancel, onConfirm, loading, answered, total }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6" style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(10px)' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 max-w-sm w-full text-center border-indigo-500/30">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <Send size={32} className="text-[var(--accent-primary)]" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">Finish Assessment?</h2>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          You have answered {answered} out of {total} questions. Are you sure you want to submit?
        </p>
        <div className="flex flex-col gap-3">
          <button 
            disabled={loading}
            onClick={onConfirm} 
            className="btn-primary w-full py-3 font-bold"
          >
            {loading ? 'Submitting...' : 'Yes, Submit Now'}
          </button>
          <button 
            disabled={loading}
            onClick={onCancel} 
            className="w-full py-3 text-sm font-medium hover:bg-white/5 rounded-xl transition-all"
            style={{ color: 'var(--text-primary)' }}
          >
            Review Answers
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FullscreenWarningOverlay({ onReturn }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(10px)' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-10 max-w-md text-center border-rose-500/30">
        <AlertTriangle size={64} className="mx-auto mb-6 text-rose-500" />
        <h2 className="text-2xl font-bold mb-4 text-white">Full Screen Required!</h2>
        <p className="mb-8 text-gray-400">Exiting full screen is not allowed during the assessment. This attempt will be flagged if you continue to navigate away.</p>
        <button 
          onClick={() => {
            document.documentElement.requestFullscreen();
            onReturn();
          }} 
          className="btn-primary w-full py-4 text-lg font-bold"
        >
          Return to Full Screen
        </button>
      </motion.div>
    </div>
  );
}
