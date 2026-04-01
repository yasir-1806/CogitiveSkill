import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Clock, Target } from 'lucide-react';

const diff = { easy: 'var(--accent-secondary)', medium: 'var(--accent-amber)', hard: 'var(--accent-rose)' };

export default function ManageLevels() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [levels, setLevels] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ topicId: '', levelNumber: 1, difficulty: 'easy', title: '', description: '', timeLimit: 600, passingScore: 70 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/topics').then(r => { setTopics(r.data.topics); if (r.data.topics.length) { setSelectedTopic(r.data.topics[0]._id); } }); }, []);
  useEffect(() => { if (selectedTopic) api.get(`/levels/${selectedTopic}`).then(r => setLevels(r.data.levels)); }, [selectedTopic]);

  const openAdd = () => { setEditing(null); setForm({ topicId: selectedTopic, levelNumber: (levels.length + 1), difficulty: 'easy', title: '', description: '', timeLimit: 600, passingScore: 70 }); setModalOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ topicId: l.topicId, levelNumber: l.levelNumber, difficulty: l.difficulty, title: l.title, description: l.description, timeLimit: l.timeLimit, passingScore: l.passingScore }); setModalOpen(true); };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) await api.put(`/levels/${editing._id}`, form);
      else await api.post('/levels', { ...form, topicId: selectedTopic });
      setModalOpen(false); api.get(`/levels/${selectedTopic}`).then(r => setLevels(r.data.levels));
    } catch (e) { alert(e.response?.data?.message || 'Error'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this level?')) return;
    await api.delete(`/levels/${id}`); api.get(`/levels/${selectedTopic}`).then(r => setLevels(r.data.levels));
  };

  const currentTopic = topics.find(t => t._id === selectedTopic);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manage Levels</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Configure difficulty levels per topic</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Level
        </motion.button>
      </div>

      {/* Topic selector */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {topics.map(t => (
          <button key={t._id} onClick={() => setSelectedTopic(t._id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
            style={{ background: selectedTopic === t._id ? 'var(--accent-primary)' : 'var(--bg-card)', color: selectedTopic === t._id ? '#fff' : 'var(--text-secondary)', border: `1px solid ${selectedTopic === t._id ? 'var(--accent-primary)' : 'var(--border-color)'}` }}>
            <span>{t.icon}</span>{t.topicName}
          </button>
        ))}
      </div>

      <div className="space-y-4 max-w-2xl">
        {levels.map((l, i) => (
          <motion.div key={l._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="stat-card flex items-center gap-4" style={{ borderColor: `${diff[l.difficulty]}30` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{ background: `${diff[l.difficulty]}15`, color: diff[l.difficulty] }}>
              {l.levelNumber}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{l.title}</p>
                <span className={`badge badge-${l.difficulty}`}>{l.difficulty}</span>
              </div>
              <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><Clock size={11} />{Math.round(l.timeLimit / 60)} min</span>
                <span className="flex items-center gap-1"><Target size={11} />Pass at {l.passingScore}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(l)} className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}><Edit2 size={15} /></button>
              <button onClick={() => handleDelete(l._id)} className="p-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}><Trash2 size={15} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Level' : 'Add Level'}>
        <div className="space-y-4">
          {[
            { label: 'Level Number', key: 'levelNumber', type: 'number' },
            { label: 'Title', key: 'title', type: 'text', placeholder: 'e.g. Level 1 – Easy' },
            { label: 'Description', key: 'description', type: 'text', placeholder: 'Brief description' },
            { label: 'Time Limit (seconds)', key: 'timeLimit', type: 'number' },
            { label: 'Passing Score (%)', key: 'passingScore', type: 'number' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input type={type} className="input-field" placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {['easy', 'medium', 'hard'].map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  className="py-2 rounded-xl font-semibold capitalize transition-all"
                  style={{ background: form.difficulty === d ? `${diff[d]}20` : 'var(--bg-secondary)', color: form.difficulty === d ? diff[d] : 'var(--text-secondary)', border: `2px solid ${form.difficulty === d ? diff[d] : 'transparent'}` }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Saving...' : editing ? 'Update Level' : 'Create Level'}
          </motion.button>
        </div>
      </Modal>
    </Layout>
  );
}
