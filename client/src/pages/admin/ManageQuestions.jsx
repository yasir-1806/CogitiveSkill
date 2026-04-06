import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { Plus, Edit2, Trash2, CheckCircle, Sparkles, Loader2, Save } from 'lucide-react';

export default function ManageQuestions() {
  const [topics, setTopics] = useState([]);
  const [levels, setLevels] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 10 });
  const [loading, setLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiConfigModalOpen, setAiConfigModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({ count: 5, optionsCount: 4, context: '' });

  useEffect(() => { api.get('/topics').then(r => { setTopics(r.data.topics); if (r.data.topics.length) setSelectedTopic(r.data.topics[0]._id); }); }, []);
  useEffect(() => { if (selectedTopic) { api.get(`/levels/${selectedTopic}`).then(r => { setLevels(r.data.levels); if (r.data.levels.length) setSelectedLevel(r.data.levels[0]._id); else setLevels([]); }); } }, [selectedTopic]);
  useEffect(() => { if (selectedLevel) api.get(`/questions/admin/${selectedLevel}`).then(r => setQuestions(r.data.questions)); }, [selectedLevel]);

  const fetchQuestions = () => { if (selectedLevel) api.get(`/questions/admin/${selectedLevel}`).then(r => setQuestions(r.data.questions)); };

  const openAdd = () => {
    setEditing(null);
    setForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 10 });
    setModalOpen(true);
  };
  
  const handleAiGenerate = async () => {
    if (!selectedLevel || !selectedTopic) return;
    setGeneratingAi(true);
    setAiConfigModalOpen(false);
    try {
      const res = await api.post('/ai/generate-questions', { 
        topicId: selectedTopic, 
        levelId: selectedLevel, 
        count: aiConfig.count || 5,
        optionsCount: aiConfig.optionsCount,
        context: aiConfig.context
      });
      setAiQuestions(res.data.data);
      if (res.data.isMock) {
        alert(`AI returned partial/low-quality output. ${res.data.count} question(s) were prepared, with fallback questions added where needed.`);
      }
      setAiModalOpen(true);
    } catch (e) {
      const payload = e.response?.data;
      if (payload?.data?.length) {
        setAiQuestions(payload.data);
        setAiModalOpen(true);
        alert(payload.message || 'Only partial high-quality questions were generated. Review and save what is useful.');
      } else {
        alert(payload?.message || 'AI Generation failed');
      }
    } finally {
      setGeneratingAi(false);
    }
  };

  const saveAiQuestions = async () => {
    setLoading(true);
    try {
      // Save questions sequentially or in parallel
      await Promise.all(aiQuestions.map(q => api.post('/questions', q)));
      setAiModalOpen(false);
      fetchQuestions();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving AI questions');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (q) => {
    setEditing(q);
    setForm({ questionText: q.questionText, options: [...q.options], correctAnswer: q.correctAnswer, explanation: q.explanation || '', points: q.points });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.questionText || form.options.some(o => !o)) return alert('Fill all fields and options');
    setLoading(true);
    try {
      if (editing) await api.put(`/questions/${editing._id}`, form);
      else await api.post('/questions', { ...form, levelId: selectedLevel, topicId: selectedTopic });
      setModalOpen(false); fetchQuestions();
    } catch (e) { alert(e.response?.data?.message || 'Error saving question'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/questions/${id}`); fetchQuestions();
  };

  const handleDeleteAll = async () => {
    if (!selectedLevel) return;
    if (!window.confirm('WARNING: This will delete ALL questions in this level. Proceed?')) return;
    setLoading(true);
    try {
      await api.delete(`/questions/level/${selectedLevel}`);
      fetchQuestions();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manage Questions</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Add MCQ questions to levels</p>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            onClick={() => setAiConfigModalOpen(true)} 
            disabled={!selectedLevel || generatingAi} 
            className="px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm"
            style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            {generatingAi ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            AI Generate
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} onClick={handleDeleteAll} disabled={!selectedLevel || loading} className="px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
            <Trash2 size={18} /> Delete All
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} onClick={openAdd} disabled={!selectedLevel} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Question
          </motion.button>
        </div>
      </div>

      {/* Topic & Level selectors */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {topics.map(t => (
            <button key={t._id} onClick={() => setSelectedTopic(t._id)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: selectedTopic === t._id ? 'var(--accent-primary)' : 'var(--bg-card)', color: selectedTopic === t._id ? '#fff' : 'var(--text-secondary)', border: `1px solid ${selectedTopic === t._id ? 'var(--accent-primary)' : 'var(--border-color)'}` }}>
              {t.icon} {t.topicName}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {levels.map(l => (
            <button key={l._id} onClick={() => setSelectedLevel(l._id)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: selectedLevel === l._id ? 'rgba(168,85,247,0.15)' : 'var(--bg-card)', color: selectedLevel === l._id ? 'var(--accent-primary)' : 'var(--text-secondary)', border: `1px solid ${selectedLevel === l._id ? 'var(--accent-primary)' : 'var(--border-color)'}` }}>
              Level {l.levelNumber} – {l.difficulty}
            </button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <motion.div key={q._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="stat-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-primary)' }}>{i + 1}</span>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{q.questionText}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 ml-10">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 text-sm p-2 rounded-lg"
                      style={{ background: oi === q.correctAnswer ? 'rgba(168,85,247,0.08)' : 'var(--bg-secondary)', border: `1px solid ${oi === q.correctAnswer ? 'rgba(168,85,247,0.3)' : 'transparent'}` }}>
                      {oi === q.correctAnswer && <CheckCircle size={12} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />}
                      <span style={{ color: oi === q.correctAnswer ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(q)} className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(q._id)} className="p-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}><Trash2 size={15} /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {questions.length === 0 && selectedLevel && (
          <div className="text-center py-12 stat-card" style={{ color: 'var(--text-secondary)' }}>No questions yet. Add the first one!</div>
        )}
      </div>
 
      <Modal isOpen={aiConfigModalOpen} onClose={() => setAiConfigModalOpen(false)} title="AI Generation Config">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set the parameters for AI question generation.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Number of Questions</label>
              <input 
                type="number" 
                min="1" 
                max="20"
                className="input-field" 
                value={aiConfig.count} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setAiConfig(prev => ({ ...prev, count: '' }));
                  } else {
                    const parsed = parseInt(val);
                    if (!isNaN(parsed)) setAiConfig(prev => ({ ...prev, count: Math.min(20, Math.max(1, parsed)) }));
                  }
                }} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Options Per Question</label>
              <div className="input-field bg-[var(--bg-secondary)] flex items-center px-4" style={{ opacity: 0.8 }}>
                4 Options (Required)
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>Backend validation requires exactly 4 options.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 mt-3" style={{ color: 'var(--text-secondary)' }}>Custom Instructions (Optional)</label>
            <textarea 
              className="input-field resize-none" 
              rows={2} 
              placeholder="e.g. Focus on logical puzzles, keep options distinct..."
              value={aiConfig.context}
              onChange={e => setAiConfig(prev => ({ ...prev, context: e.target.value }))}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            onClick={handleAiGenerate} 
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
          >
            <Sparkles size={18} /> {generatingAi ? 'Generating...' : 'Generate with AI'}
          </motion.button>
        </div>
      </Modal>
 
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="AI Generated Questions Preview">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Review the questions generated by AI before adding them to this level.</p>
          {aiQuestions.map((q, i) => (
            <div key={i} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <p className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{i + 1}. {q.questionText}</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`text-xs p-2 rounded-lg ${oi === q.correctAnswer ? 'bg-[rgba(168,85,247,0.15)] border border-[var(--accent-primary)]' : 'bg-[var(--bg-card)] border border-transparent'}`}>
                    {opt}
                  </div>
                ))}
              </div>
              {q.explanation && <p className="text-[10px] italic" style={{ color: 'var(--text-secondary)' }}>{q.explanation}</p>}
            </div>
          ))}
          <motion.button whileHover={{ scale: 1.02 }} onClick={saveAiQuestions} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Add All To Level
          </motion.button>
        </div>
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Question' : 'Add Question'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Question Text</label>
            <textarea className="input-field resize-none" rows={3} value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} placeholder="Enter the question..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Options (click to mark correct)</label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <button onClick={() => setForm(f => ({ ...f, correctAnswer: i }))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all"
                  style={{ background: form.correctAnswer === i ? 'rgba(168,85,247,0.2)' : 'var(--bg-secondary)', color: form.correctAnswer === i ? 'var(--accent-primary)' : 'var(--text-secondary)', border: `2px solid ${form.correctAnswer === i ? 'var(--accent-primary)' : 'transparent'}` }}>
                  {String.fromCharCode(65 + i)}
                </button>
                <input className="input-field flex-1" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt}
                  onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(f => ({ ...f, options: opts })); }} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Points</label>
              <input type="number" className="input-field" value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Explanation (optional)</label>
              <input className="input-field" value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Why this answer?" />
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Saving...' : editing ? 'Update Question' : 'Add Question'}
          </motion.button>
        </div>
      </Modal>
    </Layout>
  );
}
