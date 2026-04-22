import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Users, Mail, Search, Trash2, Calendar } from 'lucide-react';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = () => {
    api.get('/admin/students')
      .then(r => {
        setStudents(r.data.students || []);
        setFiltered(r.data.students || []);
        setError('');
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        setError(err?.response?.data?.message || 'Failed to load students');
        setStudents([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    setFiltered(students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())));
  }, [search, students]);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this student?')) return;
    await api.delete(`/admin/students/${id}`); fetchStudents();
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manage Students</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">{students.length} registered students</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-3.5" style={{ color: 'var(--text-secondary)' }} />
        <input className="input-field pl-10" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="stat-card overflow-hidden">
        {error && (
          <div className="mb-4 p-4 rounded-lg text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
            <div className="flex items-center justify-between">
              <span>❌ {error}</span>
              <button onClick={fetchStudents} className="px-3 py-1 rounded text-xs font-medium"
                style={{ background: 'rgba(244,63,94,0.2)', color: '#f43f5e' }}>
                Retry
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                {['Student', 'Email', 'Topics', 'Badges', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                        style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff' }}>
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                   <td className="px-4 py-4">
                    {s.registeredTopics?.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {s.registeredTopics.map(t => <span key={t._id} title={t.topicName} className="text-xl">{t.icon}</span>)}
                      </div>
                    ) : <span className="text-sm opacity-40">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    {s.badges?.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {s.badges.slice(0, 3).map((b, bi) => <span key={bi} title={b.name} className="text-lg">{b.icon}</span>)}
                      </div>
                    ) : <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>—</span>}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1"><Calendar size={12} />{new Date(s.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => handleDelete(s._id)} className="p-2 rounded-lg transition-colors"
                      style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && !error && (
                <tr><td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--text-secondary)' }}>No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
