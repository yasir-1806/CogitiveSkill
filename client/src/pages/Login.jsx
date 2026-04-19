import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response) => {
    if (!response?.credential) {
      setError('Google did not return a credential. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <div className="glow-orb w-72 h-72 top-1/4 left-1/4 opacity-10 fixed" style={{ background: 'var(--accent-primary)' }} />
      <div className="glow-orb w-64 h-64 bottom-1/4 right-1/4 opacity-10 fixed" style={{ background: 'var(--accent-primary)' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size={68} />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Continue your cognitive journey</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
            {error}
          </motion.div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }}></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-gray-500" style={{ background: 'var(--glass-bg)' }}>Sign in with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-3.5" style={{ color: 'var(--text-secondary)' }} />
            <input type="email" placeholder="Email address" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field pl-10" required />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3.5" style={{ color: 'var(--text-secondary)' }} />
            <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-field pl-10 pr-10" required />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3.5" style={{ color: 'var(--text-secondary)' }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
            disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
            {loading ? <><Loader size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold" style={{ color: 'var(--accent-primary)' }}>Create one</Link>
        </p>
        <p className="text-center mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Admin?{' '}
          <Link to="/admin/login" className="font-semibold" style={{ color: '#ff003c' }}>Admin Login</Link>
        </p>

        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }}></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="px-2 text-gray-500" style={{ background: 'var(--glass-bg)' }}>Or sign in with Google</span>
            </div>
          </div>

          <div className="google-login-wrap mx-auto flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google authentication popup failed. Check authorized origins and try again.')}
              type="standard"
              theme="outline"
              size="large"
              text="signin_with"
              locale="en"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
