import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_ROOT, API_URL, setStoredAuth } from "../utils/auth";
import { setPageMeta } from "../utils/meta";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => new URLSearchParams(location.search).get("redirect") || "/courses", [location.search]);

  useEffect(() => {
    setPageMeta({
      title: "Create Account | PrepTube",
      description: "Create a PrepTube account and start turning YouTube playlists into collaborative study rooms.",
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/register`, {
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setStoredAuth(res.data.token, {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        username: res.data.username,
        avatar: res.data.avatar,
        plan: res.data.plan,
      });
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_25%)]" />
      <div className="w-full max-w-md relative z-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">PrepTube</Link>
          <p className="text-white/45 mt-2">Create your collaborative learning identity</p>
        </div>

        {error ? <p className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

        <a href={`${API_ROOT}/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`} className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-100 transition-all mb-6 shadow-lg">
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Continue with Google
        </a>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40" required />
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username (optional)" className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@gmail.com" className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40" required />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40" required />
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40" required />
          <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-white/40 text-sm text-center mt-6">
          Already have an account? <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-red-300 hover:text-red-200">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

