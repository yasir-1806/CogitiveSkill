import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { Plus, Trash2, Users, Clock, Calendar, CheckCircle, UserCheck } from 'lucide-react';
import { format, addDays } from 'date-fns';

const SLOT_TEMPLATES = [
  { startTime: '09:00', endTime: '10:00', slotLabel: 'Slot 1' },
  { startTime: '11:00', endTime: '12:00', slotLabel: 'Slot 2' },
  { startTime: '14:00', endTime: '15:00', slotLabel: 'Slot 3' },
  { startTime: '16:00', endTime: '17:00', slotLabel: 'Slot 4' },
];

export default function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', slotLabel: 'Slot 1', maxStudents: 30 });
  const [loading, setLoading] = useState(false);
  const [bulkDate, setBulkDate] = useState('');

  // Attendance Modal state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeSlotData, setActiveSlotData] = useState(null);
  const [slotBookings, setSlotBookings] = useState([]);

  const fetchSlots = () => api.get(`/slots?date=${selectedDate}`).then(r => setSlots(r.data.slots)).catch(console.error);
  useEffect(() => { fetchSlots(); }, [selectedDate]);

  const handleCreate = async () => {
    setLoading(true);
    try { await api.post('/slots', form); setModalOpen(false); fetchSlots(); }
    catch (e) { alert(e.response?.data?.message || 'Error creating slot'); } finally { setLoading(false); }
  };

  const handleBulkCreate = async () => {
    if (!bulkDate) return alert('Select a date for bulk creation');
    setLoading(true);
    try {
      for (const tmpl of SLOT_TEMPLATES) await api.post('/slots', { ...tmpl, date: bulkDate, maxStudents: 30 });
      setSelectedDate(bulkDate); fetchSlots();
    } catch (e) { alert('Error in bulk creation'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this slot?')) return;
    await api.delete(`/slots/${id}`); fetchSlots();
  };

  const openAttendanceModal = async (slot) => {
    setActiveSlotData(slot);
    setAttendanceModalOpen(true);
    try {
      const res = await api.get(`/admin/slots/${slot._id}/bookings`);
      setSlotBookings(res.data.bookings || []);
    } catch (e) { alert('Could not fetch bookings'); }
  };

  const toggleAttendance = async (bookingId, currentStatus) => {
    // Optimistic UI update
    setSlotBookings(prev => prev.map(b => b._id === bookingId ? { ...b, isPresent: !currentStatus } : b));
    try {
      await api.put(`/admin/bookings/${bookingId}/attendance`, { isPresent: !currentStatus });
    } catch (e) {
      alert('Failed to update attendance');
      // Revert if error
      setSlotBookings(prev => prev.map(b => b._id === bookingId ? { ...b, isPresent: currentStatus } : b));
    }
  };

  const dateOptions = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'));

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manage Slots</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Create and manage test time slots</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Slot
        </motion.button>
      </div>

      {/* Bulk creator */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="stat-card mb-6">
        <h2 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Bulk Create (4 default slots)</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" className="input-field w-auto" value={bulkDate} onChange={e => setBulkDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
          <motion.button whileHover={{ scale: 1.05 }} onClick={handleBulkCreate} disabled={loading}
            className="px-5 py-2.5 rounded-xl font-semibold btn-primary">
            {loading ? 'Creating...' : 'Create All 4 Slots'}
          </motion.button>
        </div>
      </motion.div>

      {/* Date tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {dateOptions.map(d => (
          <button key={d} onClick={() => setSelectedDate(d)}
            className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ 
              background: selectedDate === d ? 'var(--accent-primary)' : 'var(--bg-card)', 
              color: selectedDate === d ? '#fff' : 'var(--text-secondary)', 
              border: `1px solid ${selectedDate === d ? 'var(--accent-primary)' : 'var(--border-color)'}` 
            }}>
            {format(new Date(d + 'T00:00:00'), 'EEE, MMM d')}
          </button>
        ))}
      </div>

      {/* Slots grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slots.map((slot, i) => {
          const booked = slot.bookedStudents?.length || 0;
          const pct = Math.round((booked / slot.maxStudents) * 100);
          return (
            <motion.div key={slot._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{slot.slotLabel}</p>
                  <div className="flex items-center gap-1 text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <Clock size={12} />{slot.startTime} – {slot.endTime}
                  </div>
                </div>
                <button onClick={() => handleDelete(slot._id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                <Users size={13} />{booked}/{slot.maxStudents} booked
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#f43f5e' : pct >= 70 ? 'var(--accent-amber)' : 'var(--accent-secondary)' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{slot.maxStudents - booked} seats available</p>
              <motion.button whileHover={{ scale: 1.02 }} onClick={() => openAttendanceModal(slot)}
                className="w-full mt-3 py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <UserCheck size={16} /> Verify Attendance
              </motion.button>
            </motion.div>
          );
        })}
        {slots.length === 0 && <div className="col-span-4 text-center py-12" style={{ color: 'var(--text-secondary)' }}>No slots for this date. Create some!</div>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Slot">
        <div className="space-y-4">
          {[
            { label: 'Date', key: 'date', type: 'date' },
            { label: 'Start Time', key: 'startTime', type: 'time' },
            { label: 'End Time', key: 'endTime', type: 'time' },
            { label: 'Slot Label', key: 'slotLabel', type: 'text', placeholder: 'e.g. Slot 1' },
            { label: 'Max Students', key: 'maxStudents', type: 'number' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input type={type} className="input-field" placeholder={placeholder} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} />
            </div>
          ))}
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleCreate} disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Creating...' : 'Create Slot'}
          </motion.button>
        </div>
      </Modal>

      <Modal isOpen={attendanceModalOpen} onClose={() => setAttendanceModalOpen(false)} title={`Attendance - ${activeSlotData?.slotLabel}`}>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {activeSlotData?.startTime} to {activeSlotData?.endTime}
        </p>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {slotBookings.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No students booked for this slot yet.</div>
          ) : (
            slotBookings.map(b => (
              <div key={b._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl gap-4" 
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    {b.studentId?.name} 
                    {b.isPresent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-secondary)' }}>Verified</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{b.studentId?.email}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: 'var(--accent-primary)' }}>{b.topicId?.topicName} • {b.levelId?.title}</p>
                </div>
                <button
                  onClick={() => toggleAttendance(b._id, b.isPresent)}
                  className="px-4 py-2 rounded-lg text-sm font-bold flex flex-shrink-0 items-center gap-2 transition-all w-full sm:w-auto justify-center"
                  style={{ 
                    background: b.isPresent ? 'rgba(244,63,94,0.1)' : 'var(--accent-primary)',
                    color: b.isPresent ? '#f43f5e' : '#fff',
                    border: `1px solid ${b.isPresent ? 'rgba(244,63,94,0.3)' : 'transparent'}`
                  }}>
                  {b.isPresent ? 'Mark Absent' : 'Mark Present'}
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </Layout>
  );
}
