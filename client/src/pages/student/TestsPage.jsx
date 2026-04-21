import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, BrainCircuit, AlertTriangle, PlayCircle, CalendarClock } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

export default function TestsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/bookings/my');
        const fetchedBookings = (res.data.bookings || []).filter(b => b.bookingStatus !== 'completed');
        console.log('Fetched bookings (non-completed):', fetchedBookings.length);
        setBookings(fetchedBookings);
      } catch (e) {
        console.error('Failed to fetch bookings', e);
        setError(e.response?.data?.message || e.message || 'Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusDisplay = (booking) => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');
    const slot = booking.slotId;

    if (!slot) return null;

    if (booking.bookingStatus === 'completed') {
      return (
        <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--accent-secondary)' }}>
          <CheckCircle size={16} /> Completed
        </span>
      );
    }

    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'missed') {
      return (
        <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          <AlertTriangle size={16} /> {booking.bookingStatus}
        </span>
      );
    }

    if (slot.date === todayStr) {
      if (booking.bookingStatus === 'confirmed') {
        const isEnded = currentTime > slot.endTime;
        const isStarted = currentTime >= slot.startTime;
        
        // If attendance not verified, show waiting message
        if (!booking.isPresent && isStarted && !isEnded) {
          return (
            <div className="flex flex-col gap-2 mt-2">
              <div className="w-full flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-bold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                <AlertTriangle size={16} /> Attendance Not Verified
              </div>
              <p className="text-[10px] text-center" style={{ color: 'var(--accent-amber)' }}>
                Waiting for admin to verify your attendance. Check back soon.
              </p>
            </div>
          );
        }
        
        // Show test link only if attendance is verified and time is in slot
        if (isStarted && !isEnded && booking.isPresent) {
          return (
            <div className="flex flex-col gap-2 mt-2">
              <Link
                to={`/test?bookingId=${booking._id}`}
                state={{ booking }}
                className="btn-primary w-full flex justify-center items-center gap-2 py-2 shadow-[0_4px_15px_rgba(168,85,247,0.3)]"
              >
                <PlayCircle size={18} /> Enter Test Now
              </Link>
            </div>
          );
        } else if (!isStarted) {
          return (
            <span className="flex items-center justify-center gap-1 text-sm font-semibold w-full mt-2 py-2 rounded-lg" 
                  style={{ background: 'var(--bg-card)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
              <CalendarClock size={16} /> Upcoming Slot
            </span>
          );
        } else if (isEnded) {
           return (
             <span className="flex items-center justify-center gap-1 text-sm font-semibold w-full mt-2 py-2 rounded-lg" 
                   style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
               <AlertTriangle size={16} /> Session Ended
             </span>
           );
        }
      }
    }

    // Upcoming
    return (
      <span className="flex items-center justify-center gap-1 text-sm font-semibold w-full mt-2 py-2 rounded-lg" 
            style={{ background: 'var(--bg-card)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}>
        <CalendarClock size={16} /> Upcoming
      </span>
    );
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold gradient-text">My Tests {bookings.length > 0 && `(${bookings.length})`}</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>View your booked slots and attend your active tests.</p>
        </div>
        {error && (
          <div className="p-2 px-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            Error: {error}
          </div>
        )}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <BrainCircuit size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Tests Booked</h3>
          <p className="mb-6">You haven't scheduled any cognitive assessments yet.</p>
          <div className="flex flex-col items-center gap-4">
            <Link to="/book-slot" className="btn-primary px-10 py-3 text-lg font-bold">Book a Slot Now</Link>
            
            {/* Troubleshooting Section */}
            <div className="mt-12 pt-8 border-t border-[var(--border-color)] w-full max-w-md">
              <p className="text-xs mb-3 font-semibold uppercase tracking-wider opacity-50">Troubleshooting</p>
              <div className="flex justify-center gap-6">
                 <button onClick={() => window.location.reload()} className="text-xs underline hover:text-[var(--accent-primary)] transition-colors">Refresh Dashboard</button>
                 <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="text-xs text-rose-500 underline hover:text-rose-400 transition-colors">Fix Connection (Session Reset)</button>
              </div>
              <p className="text-[10px] mt-4 opacity-30">Account: {useAuth().user?.email} | {useAuth().user?._id?.slice(-8)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking, i) => (
            <motion.div 
              key={booking._id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              className="stat-card flex flex-col justify-between"
              style={{
                border: booking.slotId?.date === format(new Date(), 'yyyy-MM-dd') && booking.bookingStatus === 'confirmed'
                        ? '1px solid rgba(168,85,247,0.4)' : '1px solid var(--border-color)'
              }}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(168,85,247,0.2)' }}>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.05))' }} />
                    <span className="text-lg relative z-10" style={{ color: 'var(--accent-primary)' }}>{booking.topicId?.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{booking.topicId?.topicName}</h3>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{booking.levelId?.title}</p>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <CalendarClock size={16} /> 
                    <span>Date: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{booking.slotId?.date}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Clock size={16} />
                    <span>Time: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{booking.slotId?.startTime} - {booking.slotId?.endTime}</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                {getStatusDisplay(booking)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
