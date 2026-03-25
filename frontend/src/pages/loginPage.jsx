import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ROOT = API_URL.replace(/\/api\/?$/, '');

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/login`, {
        email: email.trim().toLowerCase(),
        password
      });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify({
        id: res.data._id,
        name: res.data.name,
        email: res.data.email
      }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">Prep</span>
            <span className="text-3xl font-black tracking-tight text-white/30">Tube</span>
          </Link>
          <p className="text-white/40 text-sm mt-2 tracking-wide">Welcome back</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 shadow-2xl backdrop-blur-sm"
        >
          <h1 className="text-xl font-bold text-white mb-4 text-center">Register or login with google</h1>
          {/* <p className="text-white/40 text-sm mb-7">Enter your credentials to continue</p> */}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign In Button */}
          <a
            href={`${API_ROOT}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all mb-6 shadow-lg"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            Continue with Google
          </a>

          {/* Divider */}
          {/* <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/40 text-xs">Or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div> */}

          

          {/* <p className="text-white/30 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 font-medium transition-colors">
              Create one
            </Link>
          </p> */}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
