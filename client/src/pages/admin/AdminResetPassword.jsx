import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Key, Loader, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function AdminResetPassword() {
  const [form, setForm] = useState({ email: '', masterKey: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/admin/reset-password', form);
      setSuccess(true);
      setTimeout(() => navigate('/admin/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#ff003c,#bc13fe)' }}>
            <Key size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reset Admin Password</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Verify master key to continue</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
            <p className="font-bold text-lg mb-2">Password Reset!</p>
            <p className="text-sm opacity-60">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20">{error}</div>}
            
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 opacity-40" />
              <input type="email" placeholder="Admin Email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field pl-10" required />
            </div>

            <div className="relative">
              <Shield size={18} className="absolute left-3 top-3.5 opacity-40" />
              <input type="password" placeholder="Master Verification Key" value={form.masterKey}
                onChange={e => setForm({ ...form, masterKey: e.target.value })}
                className="input-field pl-10" required />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 opacity-40" />
              <input type="password" placeholder="New Password (min 6 chars)" value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                className="input-field pl-10" required minLength={6} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <Loader size={18} className="animate-spin" /> : 'Reset Password'}
            </button>

            <Link to="/admin/login" className="block text-center text-sm font-medium mt-4 opacity-60 hover:opacity-100">
              Back to Login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
