import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import posthog from "posthog-js";
import { API_ROOT, API_URL, setStoredAuth } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { prepareAvatarUpload } from "../utils/avatarUpload";
import { IC } from "./Icons";

const Field = ({ icon: Icon, type = "text", value, onChange, placeholder, required, children }) => (
  <div className="relative">
    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
    />
    {children}
  </div>
);

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const avatarInputRef = useRef(null);
  const redirectTo = useMemo(
    () => new URLSearchParams(location.search).get("redirect") || "/courses",
    [location.search]
  );

  useEffect(() => {
    setPageMeta({
      title: "Create Account | PrepTube",
      description: "Create a PrepTube account and start turning YouTube playlists into collaborative study rooms.",
    });
  }, []);

  const handleAvatarSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setAvatarUploading(true);
    try {
      const preparedAvatar = await prepareAvatarUpload(file);
      setAvatar(preparedAvatar);
    } catch (uploadError) {
      setError(uploadError.message || "Unable to process selected image");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

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
        avatar,
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
      posthog.capture("user_signed_up", { method: "email" });
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-orange-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <div className="text-center mb-7">
          <Link to="/" className="inline-block text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
            PrepTube
          </Link>
          <p className="text-white/40 text-sm mt-2 font-medium">Create your collaborative learning identity</p>
        </div>

        <div className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
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
            <Field icon={IC.User} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />

            <div className="relative">
              <IC.User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username (optional)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
              />
            </div>

            <Field icon={IC.Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />

            <div className="relative">
              <IC.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 cursor-pointer active:scale-0.9">
                {showPwd ? <IC.EyeOff className="w-4 h-4" /> : <IC.Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <IC.Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/25 border border-white/10 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white/85">Profile avatar</p>
                <p className="text-xs text-white/35">{avatar ? "Avatar ready to upload" : "Optional image for your profile"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer active:scale-0.9"
                >
                  {avatarUploading ? "Processing..." : avatar ? "Change" : "Upload"}
                </button>
                {avatar ? (
                  <button
                    type="button"
                    onClick={() => setAvatar("")}
                    className="rounded-2xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 cursor-pointer active:scale-0.9"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelection}
              className="hidden"
            />

            <button
              type="submit"
              disabled={loading || avatarUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50 text-sm shadow-lg shadow-red-500/20 hover:scale-[1.01]  transition-transform cursor-pointer active:scale-0.9"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <IC.Zap className="w-4 h-4" />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-white/35 text-xs text-center mt-5 font-medium">
            Already have an account?{" "}
            <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-red-300 hover:text-red-200">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
