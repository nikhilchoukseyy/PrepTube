import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { IC } from "../pages/Icons";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "Reset Password | PrepTube",
      description: "Set a new password for your PrepTube account.",
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
      setSuccess(true);
      // 2 sec baad login page pe redirect
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-orange-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent"
          >
            PrepTube
          </Link>
          <p className="text-white/40 text-sm mt-2 font-medium">Set a new password</p>
        </div>

        <div className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

          {/* Success State */}
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
                <IC.Check className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Password updated! 🎉</h2>
              <p className="text-white/45 text-sm leading-relaxed mb-4">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <span className="w-5 h-5 border-2 border-white/20 border-t-red-400 rounded-full animate-spin inline-block" />
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <IC.X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* New Password */}
                <div className="relative">
                  <IC.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                  >
                    {showPwd ? <IC.EyeOff className="w-4 h-4" /> : <IC.Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <IC.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50 text-sm shadow-lg shadow-red-500/20 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <IC.Lock className="w-4 h-4" />
                  )}
                  {loading ? "Updating password..." : "Reset password"}
                </button>
              </form>

              <p className="text-white/35 text-xs text-center mt-5 font-medium">
                Link expired?{" "}
                <Link to="/forgot-password" className="text-red-300 hover:text-red-200">
                  Request a new one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
