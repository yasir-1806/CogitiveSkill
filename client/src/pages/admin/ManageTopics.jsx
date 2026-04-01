import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Brain } from 'lucide-react';

const emojis = ['🧠', '🔍', '🎯', '🔮', '⚡', '📚', '⏱️', '💡', '🔢', '🌟'];
const gradients = [
  'from-indigo-500 to-purple-600', 'from-cyan-500 to-blue-600', 'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600',
];

export default function ManageTopics() {
  const [topics, setTopics] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ topicName: '', description: '', icon: '🧠', color: '#6366f1', gradient: gradients[0] });
  const [loading, setLoading] = useState(false);

  const fetchTopics = () => api.get('/topics').then(r => setTopics(r.data.topics));
  useEffect(() => { fetchTopics(); }, []);

  const openAdd = () => { setEditing(null); setForm({ topicName: '', description: '', icon: '🧠', color: '#6366f1', gradient: gradients[0] }); setModalOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ topicName: t.topicName, description: t.description, icon: t.icon, color: t.color, gradient: t.gradient }); setModalOpen(true); };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) await api.put(`/topics/${editing._id}`, form);
      else await api.post('/topics', form);
      setModalOpen(false); fetchTopics();
    } catch (e) { alert(e.response?.data?.message || 'Error'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    await api.delete(`/topics/${id}`); fetchTopics();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manage Topics</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Create and manage cognitive assessment topics</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Topic
        </motion.button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((t, i) => (
          <motion.div key={t._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="stat-card" style={{ borderColor: `${t.color}30` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${t.color}15` }}>{t.icon}</div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} className="p-2 rounded-lg transition-colors" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(t._id)} className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}><Trash2 size={15} /></button>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{t.topicName}</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.description}</p>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Topic' : 'Add New Topic'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Topic Name</label>
            <input className="input-field" value={form.topicName} onChange={e => setForm({ ...form, topicName: e.target.value })} placeholder="e.g. Logical Reasoning" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this topic..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))}
                className="w-10 h-10 rounded-xl text-xl transition-all"
                style={{ background: form.icon === e ? 'rgba(168,85,247,0.2)' : 'var(--bg-secondary)', border: `2px solid ${form.icon === e ? 'var(--accent-primary)' : 'transparent'}` }}>{e}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Color</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer border-0" style={{ background: 'none' }} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Saving...' : editing ? 'Update Topic' : 'Create Topic'}
          </motion.button>
        </div>
      </Modal>
    </Layout>
  );
}
