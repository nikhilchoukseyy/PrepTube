import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { IC } from "../pages/Icons";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "Forgot Password | PrepTube",
      description: "Reset your PrepTube account password.",
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, {
        email: email.trim().toLowerCase(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-orange-500/8 rounded-full blur-[100px]" />
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
          <p className="text-white/40 text-sm mt-2 font-medium">Reset your password</p>
        </div>

        <div className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

          {/* Success State */}
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
                <IC.Mail className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Check your inbox</h2>
              <p className="text-white/45 text-sm leading-relaxed mb-6">
                If an account exists for <span className="text-white/70 font-medium">{email}</span>,
                a password reset link has been sent. Check spam too!
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-200 font-medium transition-colors"
              >
                <IC.ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
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

              <p className="text-white/45 text-sm mb-5 leading-relaxed">
                Enter your Gmail address and we'll send you a link to reset your password.
              </p>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50 text-sm shadow-lg shadow-red-500/20 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <IC.Mail className="w-4 h-4" />
                  )}
                  {loading ? "Sending link..." : "Send reset link"}
                </button>
              </form>

              <p className="text-white/35 text-xs text-center mt-5 font-medium">
                Remembered it?{" "}
                <Link to="/login" className="text-red-300 hover:text-red-200">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
