import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, UserPlus, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [registeredTopicIds, setRegisteredTopicIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth(); // or we fetch fresh profile

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, profileRes] = await Promise.all([
          api.get('/topics'),
          api.get('/auth/profile')
        ]);
        setTopics(topicsRes.data.topics);
        setRegisteredTopicIds(profileRes.data.user?.registeredTopics || []);
      } catch (e) {
        console.error('Failed to fetch topics data:', e);
        // Optionally add a toast here if a toast system is in place
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRegister = async (e, topicId) => {
    e.stopPropagation();
    setRegisteringId(topicId);
    try {
      const res = await api.post(`/topics/${topicId}/register`);
      if (res.data.success) {
        setRegisteredTopicIds(res.data.registeredTopics);
      }
    } catch (err) {
      console.error('Registration failed', err);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleTopicClick = (topicId) => {
    if (registeredTopicIds.includes(topicId)) {
      navigate(`/topics/${topicId}/levels`);
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Available Courses</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Register for a topic to unlock its assessments and book slots.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {topics.map((topic, i) => {
          const isRegistered = registeredTopicIds.includes(topic._id);
          const accentColor = 'var(--accent-primary)';
          
          return (
            <motion.div key={topic._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => handleTopicClick(topic._id)}
              className={`stat-card relative overflow-hidden ${isRegistered ? 'cursor-pointer' : ''}`}
              style={{ borderColor: isRegistered ? 'rgba(168,85,247,0.4)' : 'var(--border-color)', opacity: isRegistered ? 1 : 0.85 }}
            >
              {/* Gradient top bar */}
              <div className="h-1.5 rounded-full mb-5" style={{ background: `linear-gradient(90deg, ${accentColor}, rgba(168,85,247,0.5))` }} />

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-all"
                style={{ background: isRegistered ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.05)', filter: isRegistered ? 'none' : 'grayscale(0.5)' }}>
                {topic.icon}
              </div>

              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{topic.topicName}</h3>
                {/* Status Badge */}
                {isRegistered && (
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" 
                       style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(168,85,247,0.3)', flexShrink: 0 }}>
                    <CheckCircle size={10} /> Enrolled
                  </div>
                )}
              </div>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{topic.description}</p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)' }}>
                  {topic.totalLevels} Levels
                </span>
                
                {isRegistered ? (
                  <motion.div whileHover={{ x: 4 }} className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                    Start <ArrowRight size={16} />
                  </motion.div>
                ) : (
                  <button 
                    onClick={(e) => handleRegister(e, topic._id)}
                    disabled={registeringId === topic._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: 'var(--accent-primary)', color: '#fff' }}
                  >
                    {registeringId === topic._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Register
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
