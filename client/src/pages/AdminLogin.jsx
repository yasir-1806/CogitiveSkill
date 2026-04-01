import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.user.role !== 'admin') return setError('Not an admin account');
      login(res.data.token, res.data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="glow-orb w-72 h-72 top-1/3 left-1/3 opacity-20 fixed" style={{ background: '#ff003c' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 w-full max-w-md z-10 relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#ff003c,#bc13fe)' }}>
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Access</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>CognIQ Administration Panel</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-3.5" style={{ color: 'var(--text-secondary)' }} />
            <input type="email" placeholder="Admin email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field pl-10" required />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3.5" style={{ color: 'var(--text-secondary)' }} />
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field pl-10" required />
            </div>
            <div className="flex justify-end">
              <Link to="/admin/reset-password" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }} className="hover:text-indigo-400">
                Forgot Password?
              </Link>
            </div>
          <motion.button whileHover={{ scale: 1.02 }} type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#ff003c,#bc13fe)', boxShadow: '0 0 20px rgba(255,0,60,0.6)' }}>
            {loading ? <><Loader size={18} className="animate-spin" /> Authenticating...</> : 'Access Admin Panel'}
          </motion.button>
        </form>
        <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Student?{' '}<Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Student Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
