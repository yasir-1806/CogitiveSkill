import { motion } from 'framer-motion';

export default function AnimatedCard({ children, className = '', delay = 0, hover = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      className={`stat-card ${className}`}
    >
      {children}
    </motion.div>
  );
}
