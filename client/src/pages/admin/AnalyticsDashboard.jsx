import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, Legend,
  LineChart, Line
} from 'recharts';
import { Users, BookOpen, BarChart3, TrendingUp, CheckCircle, Target } from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#06b6d4'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  const stats = data?.stats || {};
  const topicRadar = data?.topicPerformance?.map(t => ({ subject: t.topicName, A: t.avgScore, fullMark: 100 })) || [];
  const pieData = data?.levelCompletion || [];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1">Deep insights into platform performance</p>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Students', value: stats.totalStudents, icon: Users, color: '#6366f1' },
          { label: 'Topics', value: stats.totalTopics, icon: BookOpen, color: '#10b981' },
          { label: 'Levels', value: stats.totalLevels, icon: Target, color: '#8b5cf6' },
          { label: 'Bookings', value: stats.totalBookings, icon: BarChart3, color: '#06b6d4' },
          { label: 'Tests', value: stats.totalTests, icon: CheckCircle, color: '#f59e0b' },
          { label: 'Avg Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: '#f43f5e' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="stat-card text-center p-4">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${color}15`, color }}><Icon size={20} /></div>
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="stat-card mb-6">
        <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>Pass / Fail distribution across tests</h2>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie 
              data={pieData} 
              dataKey="count" 
              nameKey="_id" 
              cx="50%" 
              cy="50%" 
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
            >
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip 
              cursor={false}
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-secondary)' }}
            />
            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{value}</span>}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

    </Layout>
  );
}
