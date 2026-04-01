import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isLandingPage = location.pathname === '/';

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full"
      style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo always links to Landing Page */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo size={38} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="text-2xl font-bold gradient-text tracking-tight">CognIQ</span>
          </Link>

          {/* Show user controls if logged in AND NOT on Landing Page */}
          {user && !isLandingPage && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <User size={16} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: user.role === 'admin' ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)', color: user.role === 'admin' ? 'var(--accent-rose)' : 'var(--accent-primary)' }}>{user.role}</span>
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-xl transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(244,63,94,0.08)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}

          {/* Show login/get started if NOT logged in OR on Landing Page */}
          {(!user || isLandingPage) && (
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              {isLandingPage ? (
                <>
                  <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Login</Link>
                  <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
                </>
              ) : user ? (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary text-sm px-4 py-2">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Login</Link>
                  <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
