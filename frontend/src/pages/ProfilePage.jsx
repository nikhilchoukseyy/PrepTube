import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 py-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Avatar + Name header */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-red-500/30 mb-4"
            >
              {getInitials(user.name)}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white"
            >
              {user.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-white/30 text-sm mt-1"
            >
              {user.email}
            </motion.p>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden mb-4"
          >
            {/* Name row */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-white font-medium">{user.name}</p>
              </div>
              <span className="text-white/10 text-xl">👤</span>
            </div>

            {/* Email row */}
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              <span className="text-white/10 text-xl">✉️</span>
            </div>
          </motion.div>

          

          {/* Logout button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full py-3 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 text-white/50 hover:text-red-400 font-semibold rounded-xl text-sm transition-all duration-200"
          >
            Sign out
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;