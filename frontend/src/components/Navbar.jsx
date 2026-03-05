import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Re-check auth on every route change
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location]);

  // Detect scroll for glassmorphism effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = isLoggedIn
    ? [{ label: 'Playlists', to: '/' }, { label: 'Profile', to: '/profile' }]
    : [];

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-2xl'
          : 'bg-[#0a0a0a] border-b border-white/5'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/" className="flex items-center gap-1">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                Prep
              </span>
              <span className="text-2xl font-black tracking-tight text-white/40">
                Tube
              </span>
            </Link>
          </motion.div>

          {/* ── Desktop Nav ── */}
          <div className="hidden sm:flex items-center gap-6">

            {/* Nav links with animated underline */}
            {navLinks.map((link) => (
              <div key={link.to} className="relative pb-1">
                <Link
                  to={link.to}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.to) ? 'text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
                {isActive(link.to) && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
            ))}

            {/* Auth buttons with AnimatePresence for smooth swap */}
            <AnimatePresence mode="wait">
              {isLoggedIn ? (
                <motion.div
                  key="logged-in"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  {/* Pulsing online dot */}
                
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleLogout}
                    className="px-4 py-1.5 text-sm font-medium text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/40 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    Sign out
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="logged-out"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/login"
                      className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                    >
                      Log in
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/register"
                      className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 rounded-lg shadow-lg shadow-red-500/20 transition-all duration-200"
                    >
                      Get started
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Mobile Hamburger ── */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(p => !p)}
            className="sm:hidden flex flex-col gap-1.5 p-2 cursor-pointer bg-transparent border-none"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
              className="block w-5 h-0.5 bg-white/70 rounded-full"
            />
            <motion.span
              animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
              className="block w-5 h-0.5 bg-white/70 rounded-full"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
              className="block w-5 h-0.5 bg-white/70 rounded-full"
            />
          </motion.button>

        </div>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="sm:hidden overflow-hidden border-t border-white/5 bg-[#0a0a0a]"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {/* Staggered nav links */}
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`block py-2.5 text-sm font-medium transition-colors ${
                      isActive(link.to) ? 'text-white' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Auth buttons */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.2 }}
                className="flex gap-3 pt-3 border-t border-white/5 mt-1"
              >
                {isLoggedIn ? (
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-lg cursor-pointer bg-transparent"
                  >
                    Sign out
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-lg"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 rounded-lg"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;