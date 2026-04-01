import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, CheckCircle, BrainCircuit, Target } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { format, addDays } from 'date-fns';

export default function SlotBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // State from location (if navigated from LevelsPage)
  const initialTopicId = location.state?.topicId || null;
  const initialLevelId = location.state?.levelId || null;
  const initialTopicName = location.state?.topicName || '';
  const initialLevelTitle = location.state?.level?.title || '';

  // Core selection state
  const [topicId, setTopicId] = useState(initialTopicId);
  const [levelId, setLevelId] = useState(initialLevelId);
  const [topicName, setTopicName] = useState(initialTopicName);
  const [levelTitle, setLevelTitle] = useState(initialLevelTitle);

  // Data fetching state
  const [registeredTopics, setRegisteredTopics] = useState([]);
  const [topicLevels, setTopicLevels] = useState([]);
  // Calculate currently active booking date based on rolling window
  // Window: [D-1 8PM] to [D 7PM]
  const getActiveDate = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const cutoff = 19 * 60; // 7:00 PM
    const openNext = 20 * 60; // 8:00 PM
    
    if (currentTime < cutoff) return now;
    if (currentTime >= openNext) return addDays(now, 1);
    return null;
  };

  const activeDate = getActiveDate();
  const dateOptions = activeDate ? [activeDate] : [];

  const [selectedDate, setSelectedDate] = useState(activeDate || new Date());
  const [slots, setSlots] = useState([]);
  
  // UI state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Step indicator: 1 = Topic, 2 = Level, 3 = Date/Slot
  const [step, setStep] = useState((initialTopicId && initialLevelId) ? 3 : 1);

  // Fetch registered topics if we need to start from step 1
  useEffect(() => {
    if (step === 1) {
      setLoading(true);
      Promise.all([
        api.get('/topics'),
        api.get('/auth/profile')
      ]).then(([topicsRes, profileRes]) => {
        const allTopics = topicsRes.data.topics || [];
        const regIds = (profileRes.data.user?.registeredTopics || []).map(id => id.toString());
        const userTopics = allTopics.filter(t => regIds.includes(t._id.toString()));
        setRegisteredTopics(userTopics);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [step]);

  // Fetch levels when a topic is selected (Step 2)
  useEffect(() => {
    if (step === 2 && topicId) {
      setLoading(true);
      api.get(`/levels/${topicId}`).then(res => {
        setTopicLevels(res.data.levels || []);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [step, topicId]);

  // Fetch slots (Step 3)
  useEffect(() => {
    if (step === 3 && topicId && levelId) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, step, topicId, levelId]);

  const fetchSlots = async (date) => {
    setLoading(true); setSelectedSlot(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await api.get(`/slots?date=${dateStr}`);
      setSlots(res.data.slots);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true); setError('');
    try {
      await api.post('/bookings', { slotId: selectedSlot._id, topicId, levelId });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Booking failed');
    } finally { setBooking(false); }
  };



  if (success) return (
    <Layout>
      <div className="flex items-center justify-center h-full">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-12 text-center max-w-md">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
            <CheckCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--accent-secondary)' }} />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Slot Booked!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Your test slot has been confirmed. Redirecting to dashboard...</p>
        </motion.div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Book a Test Slot</h1>
        {step === 3 && topicName && (
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1 flex gap-2 items-center">
             <span>{topicName}</span> <span>→</span> <span>{levelTitle}</span>
             {!initialTopicId && (
                <button onClick={() => setStep(1)} className="text-xs ml-4 px-2 py-1 rounded-full border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors">Change</button>
             )}
          </p>
        )}
      </motion.div>

      <div className="max-w-3xl space-y-6">
        
        {/* STEP 1: SELECT REGISTERED TOPIC */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BrainCircuit size={20} style={{ color: 'var(--accent-primary)' }} /> Select Registered Topic
            </h2>
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div>
            ) : registeredTopics.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: 'var(--text-secondary)' }} className="mb-4">You haven't registered for any topics yet.</p>
                <button onClick={() => navigate('/topics')} className="btn-primary px-6 py-2 rounded-xl text-sm">Browse Topics</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {registeredTopics.map(topic => (
                  <motion.button key={topic._id} whileHover={{ scale: 1.02, y: -2 }} onClick={() => {
                    setTopicId(topic._id);
                    setTopicName(topic.topicName);
                    setStep(2);
                  }} className="p-4 rounded-xl text-left transition-all group flex items-start gap-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="text-2xl mt-1">{topic.icon}</div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{topic.topicName}</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Click to select level</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: SELECT LEVEL */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Target size={20} style={{ color: 'var(--accent-secondary)' }} /> Select Level for {topicName}
              </h2>
              <button onClick={() => setStep(1)} className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><ChevronLeft size={16}/> Back</button>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[var(--accent-secondary)] border-t-transparent rounded-full animate-spin" /></div>
            ) : topicLevels.length === 0 ? (
              <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No levels available.</p>
            ) : (
              <div className="space-y-3">
                {topicLevels.map(lvl => (
                  <motion.button key={lvl._id} disabled={!lvl.isUnlocked} whileHover={lvl.isUnlocked ? { scale: 1.01, x: 4 } : {}} onClick={() => {
                    setLevelId(lvl._id);
                    setLevelTitle(lvl.title);
                    setStep(3);
                  }} className="w-full relative p-4 rounded-xl text-left transition-all flex items-center justify-between" 
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      border: `1px solid ${lvl.isUnlocked ? 'var(--border-color)' : 'rgba(100,100,100,0.1)'}`,
                      opacity: lvl.isUnlocked ? 1 : 0.6,
                      cursor: lvl.isUnlocked ? 'pointer' : 'not-allowed'
                    }}>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{lvl.title} <span className={`ml-2 text-xs badge badge-${lvl.difficulty}`}>{lvl.difficulty}</span></h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{lvl.description}</p>
                    </div>
                    {lvl.isUnlocked ? <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }}/> : <span className="text-xs font-bold px-2 py-1 rounded" style={{background: 'var(--bg-card)'}}>Locked</span>}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3: SELECT DATE AND SLOT */}
        {step === 3 && (
          <>


            {/* Slot Grid */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock size={20} style={{ color: 'var(--accent-secondary)' }} /> Available Slots for {format(selectedDate, 'EEE, d MMM')}
              </h2>
              {loading ? (
                <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div>
              ) : slots.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No slots available for this date</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {slots.map(slot => {
                    const isFull = slot.bookedStudents?.length >= slot.maxStudents;
                    const isSelected = selectedSlot?._id === slot._id;
                    return (
                      <motion.button key={slot._id} whileHover={!isFull ? { scale: 1.02 } : {}}
                        onClick={() => !isFull && setSelectedSlot(slot)}
                        disabled={isFull}
                        className="p-4 rounded-xl text-left transition-all"
                        style={{
                          border: `2px solid ${isSelected ? 'var(--accent-primary)' : isFull ? 'rgba(120,113,108,0.1)' : 'var(--border-color)'}`,
                          background: isSelected ? 'rgba(168,85,247,0.1)' : isFull ? 'rgba(120,113,108,0.05)' : 'var(--bg-secondary)',
                          opacity: isFull ? 0.5 : 1,
                          cursor: isFull ? 'not-allowed' : 'pointer',
                        }}>
                        <p className="font-bold" style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{slot.slotLabel}</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{slot.startTime} – {slot.endTime}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: isFull ? '#f43f5e' : 'var(--accent-secondary)' }}>
                          <Users size={12} />
                          {isFull ? 'Full' : `${slot.maxStudents - (slot.bookedStudents?.length || 0)} seats left`}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Error & Book Button */}
            {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>{error}</div>}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleBook} disabled={!selectedSlot || booking}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              style={{ opacity: !selectedSlot ? 0.5 : 1 }}>
              {booking ? 'Confirming...' : 'Confirm Booking'}
            </motion.button>
          </>
        )}
      </div>
    </Layout>
  );
}
