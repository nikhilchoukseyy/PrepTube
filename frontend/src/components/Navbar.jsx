import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { clearStoredAuth, getStoredUser, getToken } from "../utils/auth";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getToken());
  const user = useMemo(() => getStoredUser(), [location.pathname]);

  const links = [
    { label: "Courses", to: "/courses" },
    { label: "Explore", to: "/explore" },
    { label: "Pricing", to: "/pricing" },
  ];

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/8 bg-black/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">PrepTube</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={isActive(link.to) ? "text-white" : "text-white/50 hover:text-white transition-colors"}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                {user?.avatar ? <img src={user.avatar} alt={user.username || user.name || "Profile"} className="w-8 h-8 rounded-full object-cover" /> : null}
                <span className="hidden sm:block text-sm text-white/80">@{user?.username || user?.name || "profile"}</span>
              </Link>
              <button onClick={handleLogout} className="px-4 py-2 rounded-full border border-white/10 text-sm text-white/70 hover:text-red-200 hover:border-red-500/30 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-full border border-white/10 text-sm text-white/75 hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-sm font-semibold">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

