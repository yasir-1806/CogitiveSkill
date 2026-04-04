import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Calendar, Trophy, TrendingUp,
  Settings, Users, BarChart3, MessageSquare, BrainCircuit, LogOut, PlusCircle, Layers, Shield
} from 'lucide-react';
import Logo from './Logo';

const studentNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/topics', icon: BookOpen, label: 'Topics' },
  { to: '/book-slot', icon: Calendar, label: 'Book Slot' },
  { to: '/tests', icon: BrainCircuit, label: 'My Tests' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/topics', icon: BrainCircuit, label: 'Topics' },
  { to: '/admin/levels', icon: Layers, label: 'Levels' },
  { to: '/admin/questions', icon: MessageSquare, label: 'Questions' },
  { to: '/admin/slots', icon: Calendar, label: 'Manage Slots' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/manage-admins', icon: Shield, label: 'Admins' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'admin' ? adminNav : studentNav;

  return (
    <aside
      className="sidebar fixed left-0 top-0 z-40 h-full flex flex-col pt-20 pb-6 px-3"
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 mb-10">
        <Logo size={42} />
        <div className="flex flex-col">
          <p className="font-bold gradient-text text-xl leading-none tracking-tight">CognIQ</p>
          <p className="text-[10px] uppercase tracking-widest mt-1 opacity-60">{user?.role} panel</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={() => { logout(); navigate('/login'); }}
        className="sidebar-item w-full text-left mt-2"
        style={{ color: 'var(--accent-rose)' }}
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
