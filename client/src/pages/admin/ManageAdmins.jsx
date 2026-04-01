import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Shield, Plus, Mail, User, Loader, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/list-admins');
      setAdmins(res.data.admins);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/admin/create-admin', form);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manage Administrators</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Add or remove system administrators</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add New Admin
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="stat-card mb-8 max-w-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
             <Shield size={20} className="text-indigo-500" /> New Admin Details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20">{error}</div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase opacity-50 block mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 opacity-40" />
                  <input type="text" placeholder="Admin Name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field pl-10" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-50 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 opacity-40" />
                  <input type="email" placeholder="Email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input-field pl-10" required />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase opacity-50 block mb-1">Password</label>
              <input type="password" placeholder="Temporary Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field" required minLength={6} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
                {submitting ? 'Creating...' : 'Create Admin Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-48">
            <Loader className="animate-spin opacity-50" />
          </div>
        ) : (
          admins.map((admin, i) => (
            <motion.div key={admin._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="stat-card flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold" 
                  style={{ background: 'var(--bg-secondary)', border: '2px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
                  {admin.name[0]}
                </div>
                <div>
                  <p className="font-bold">{admin.name}</p>
                  <p className="text-xs opacity-50">{admin.email}</p>
                </div>
              </div>
              {/* Optional: Add Delete logic if needed */}
              <Shield size={20} className="opacity-20" />
            </motion.div>
          ))
        )}
      </div>
    </Layout>
  );
}
