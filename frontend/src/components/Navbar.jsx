import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { clearStoredAuth, getStoredUser, getToken } from "../utils/auth";
import preptubeLogo from "../assets/preptube_logo.png";

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isLoggedIn = Boolean(getToken());
  const user = useMemo(() => getStoredUser(), [location.pathname]);

  const links = [
    { label: "Courses", to: isLoggedIn ? "/courses" : "/login?redirect=/courses" },
    { label: "Explore", to: "/explore" },
    { label: "FAQs", to: "/faqs" },
    { label: "Pricing", to: "/pricing" },
  ];

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Add shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/");
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`sticky top-0 z-50 border-b border-white/8 bg-black/60 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? "shadow-[0_4px_32px_rgba(0,0,0,0.5)]" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {/* <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
              PrepTube
            </span> */}
            <img src={preptubeLogo} alt="PrepTube Logo" className="w-12 h-12 bg-transparent" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-1.5 rounded-full transition-colors font-medium ${
                  isActive(link.to)
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {link.label}
                
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username || user.name || "Profile"}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-xs font-bold">
                      {(user?.username || user?.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white/80 font-medium">
                    @{user?.username || user?.name || "profile"}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-full border border-white/10 text-sm text-white/60 hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/[0.06] transition-colors cursor-pointer active:scale-0.9"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-full border border-white/10 text-sm text-white/75 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right: avatar shortcut + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn && (
              <Link to="/profile" className="shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-xs font-bold">
                    {(user?.username || user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 transition-colors text-white/80"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-16 right-0 z-50 h-[calc(100dvh-4rem)] w-72 max-w-[85vw] bg-[#0d0d0d] border-l border-white/10 flex flex-col md:hidden transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Nav Links */}
        <div className="flex flex-col gap-1 p-4 border-b border-white/8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-1">
            Navigate
          </p>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                isActive(link.to)
                  ? "text-white bg-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {link.label}
              
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div className="flex flex-col gap-2 p-4 mt-auto border-t border-white/8">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-white/8 mb-1">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                    {(user?.username || user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate">
                    @{user?.username || user?.name || "profile"}
                  </span>
                  <span className="text-xs text-white/40">View profile</span>
                </div>
              </div>
              <Link
                to="/profile"
                className="w-full text-center py-2.5 rounded-xl border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors font-medium"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-red-500/20 text-sm text-red-400 hover:bg-red-500/[0.08] transition-colors font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl border border-white/10 text-sm text-white/75 hover:text-white hover:bg-white/[0.06] transition-colors font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
