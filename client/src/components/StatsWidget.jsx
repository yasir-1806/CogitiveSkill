import { motion } from 'framer-motion';

export default function StatsWidget({ icon: Icon, label, value, color = 'var(--accent-primary)', sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}
