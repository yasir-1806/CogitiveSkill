import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import StatsWidget from '../../components/StatsWidget';
import api from '../../services/api';
import { Users, BookOpen, Calendar, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setAnalytics(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  const stats = analytics?.stats || {};
  const pieData = analytics?.levelCompletion || [];
  const pieColors = ['var(--accent-primary)', 'var(--accent-secondary)', '#7c3aed'];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Platform-wide performance overview</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsWidget icon={Users} label="Total Students" value={stats.totalStudents || 0} color="var(--accent-primary)" delay={0} />
        <StatsWidget icon={BookOpen} label="Topics" value={stats.totalTopics || 0} color="var(--accent-secondary)" delay={0.1} />
        <StatsWidget icon={CheckCircle} label="Tests Completed" value={stats.totalTests || 0} sub={`${stats.passedTests || 0} passed`} color="var(--accent-primary)" delay={0.2} />
        <StatsWidget icon={TrendingUp} label="Avg Score" value={`${stats.avgScore || 0}%`} color="var(--accent-secondary)" delay={0.3} />
      </div>

      {/* Daily registrations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Student Registrations (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics?.dailyRegistrations || []} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.2} />
            <XAxis dataKey="_id" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={false}
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-secondary)' }}
            />
            <Bar dataKey="count" fill="var(--accent-secondary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </Layout>
  );
}
