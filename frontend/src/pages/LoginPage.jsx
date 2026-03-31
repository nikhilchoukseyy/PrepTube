import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import posthog from "posthog-js";
import { API_ROOT, API_URL, setStoredAuth } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { IC } from "./Icons";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(
    () => new URLSearchParams(location.search).get("redirect") || "/courses",
    [location.search]
  );

  useEffect(() => {
    setPageMeta({
      title: "Login | PrepTube",
      description: "Sign in to PrepTube and continue your collaborative playlist learning sessions.",
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/login`, {
        email: email.trim().toLowerCase(),
        password,
      });
      setStoredAuth(res.data.token, {
        _id: res.data._id || res.data.id,
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        username: res.data.username,
        avatar: res.data.avatar,
        role: res.data.role,
        plan: res.data.plan,
        premiumExpiresAt: res.data.premiumExpiresAt,
      });
      posthog.capture("user_logged_in", { method: "email" });
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-orange-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent"
          >
            PrepTube
          </Link>
          <p className="text-white/40 text-sm mt-2 font-medium">Continue your collaborative learning</p>
        </div>

        <div className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <IC.X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          <a
            href={`${API_ROOT}/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-lg mb-5 text-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/30 text-xs uppercase tracking-[0.2em] font-medium">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <IC.Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
                required
              />
            </div>

            <div className="relative">
              <IC.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 cursor-pointer active:scale-0.9"
              >
                {showPwd ? <IC.EyeOff className="w-4 h-4" /> : <IC.Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-white/35 hover:text-red-300 transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50 text-sm shadow-lg shadow-red-500/20 hover:scale-[1.01]  transition-transform cursor-pointer active:scale-0.9"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <IC.Zap className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-white/35 text-xs text-center mt-5 font-medium">
            No account?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-red-300 hover:text-red-200"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
