import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, clearStoredAuth, getStoredUser, getToken, requireAuthRedirect, updateStoredUser } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { prepareAvatarUpload } from "../utils/avatarUpload";
import { IC } from "./Icons";

const buildPresetAvatars = (seed) => [
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || "PrepTube")}`,
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed || "PrepTube")}`,
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed || "PrepTube")}`,
  `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed || "PrepTube")}`,
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [user, setUser] = useState(storedUser);
  const [username, setUsername] = useState(storedUser?.username || "");
  const [avatar, setAvatar] = useState(storedUser?.avatar || "");
  const [status, setStatus] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleting, setDeleting] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setPageMeta({ title: "Profile | PrepTube", description: "Manage your PrepTube profile, username, avatar, and learning plan." });
  }, []);

  useEffect(() => {
    if (!getToken()) { requireAuthRedirect(navigate, "/profile"); return; }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/me`, { headers: authHeaders() });
        setUser(res.data.user);
        setUsername(res.data.user.username || "");
        setAvatar(res.data.user.avatar || "");
        updateStoredUser(res.data.user);
      } catch {
        clearStoredAuth();
        requireAuthRedirect(navigate, "/profile");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleAvatarSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("");
    setAvatarUploading(true);
    try {
      const preparedAvatar = await prepareAvatarUpload(file);
      setAvatar(preparedAvatar);
    } catch (uploadError) {
      setIsSuccess(false);
      setStatus(uploadError.message || "Unable to process selected image.");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setDeleteStatus("");
    try {
      const res = await axios.patch(`${API_URL}/users/profile`, { username, avatar }, { headers: authHeaders() });
      const updatedUser = updateStoredUser(res.data.user);
      setUser(updatedUser);
      setAvatar(updatedUser.avatar || "");
      setIsSuccess(true);
      setStatus("Profile updated successfully.");
    } catch (err) {
      setIsSuccess(false);
      setStatus(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { clearStoredAuth(); navigate("/"); };
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your profile, playlists you own, chat messages, notes, and saved progress. This cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setDeleteStatus("");
    setStatus("");

    try {
      await axios.delete(`${API_URL}/users/me`, { headers: authHeaders() });
      clearStoredAuth();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteStatus(err.response?.data?.message || "Unable to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  const handleResetAvatar = () => {
    setAvatar("");
    setStatus("");
  };

  const presetAvatars = buildPresetAvatars(username || user?.name || user?.email);
  const planColor = user?.plan === "premium" ? "text-amber-300" : "text-white/50";

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:grid lg:grid-cols-[0.75fr_1.25fr] gap-5">

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="relative mb-4">
            {avatar ? (
              <img src={avatar} alt={username || user?.name} className="w-24 h-24 rounded-full object-cover border-2 border-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
                <IC.User className="w-10 h-10 text-white/30" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#080808]" />
          </div>

          <h1 className="text-2xl font-black mt-1">@{user?.username || user?.name}</h1>
          <p className="text-white/40 text-sm mt-1 font-medium flex items-center gap-1.5 justify-center">
            <IC.Mail className="w-3.5 h-3.5" />{user?.email}
          </p>

          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <IC.Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className={`text-xs font-semibold uppercase tracking-wider ${planColor}`}>{user?.plan || "free"}</span>
          </div>

          <div className="mt-6 w-full space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/10 text-white/60 hover:text-red-200 hover:border-red-500/30 transition-colors text-sm font-medium cursor-pointer active:scale-0.9"
            >
              <IC.LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <IC.Settings className="w-5 h-5 text-white/40" />
            <h2 className="text-xl font-bold">Edit profile</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm text-white/50 mb-2 font-medium">
                <IC.User className="w-3.5 h-3.5" /> Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
              />
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-4">
                {avatar ? (
                  <img src={avatar} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                    <IC.User className="w-7 h-7 text-white/30" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Profile photo</p>
                  <p className="text-xs text-white/40 mt-1 font-medium">Upload a picture from your device, or pick one of the avatar presets below.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer active:scale-0.9"
                >
                  {avatarUploading ? "Processing..." : avatar ? "Change photo" : "Upload photo"}
                </button>
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/55 hover:bg-white/[0.05] cursor-pointer active:scale-0.9"
                >
                  Reset
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelection}
                />
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-sm text-white/50 mb-3 font-medium">
                <IC.User className="w-3.5 h-3.5" /> Avatar presets
              </p>
              <div className="flex flex-wrap gap-3">
                {presetAvatars.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`rounded-full border-2 p-0.5 transition-colors ${avatar === preset ? "border-red-400" : "border-white/10 hover:border-white/30"}`}
                  >
                    <img src={preset} alt="Avatar preset" className="w-12 h-12 rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            {status && (
              <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium border ${
                isSuccess
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                  : "bg-red-500/10 border-red-500/20 text-red-200"
              }`}>
                {isSuccess ? <IC.CheckCircle className="w-4 h-4 shrink-0" /> : <IC.X className="w-4 h-4 shrink-0" />}
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || deleting}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50 text-sm shadow-lg shadow-red-500/20 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer active:scale-0.9"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <IC.Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save changes"}
            </button>

            <div className="rounded-[24px] border border-red-500/20 bg-red-500/[0.08] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-red-500/10 p-2 text-red-200">
                  <IC.Trash className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-red-100">Delete account</h3>
                  <p className="mt-1 text-sm text-red-100/70">
                    Permanently remove your PrepTube account and the content tied to it. This action cannot be undone.
                  </p>
                </div>
              </div>

              {deleteStatus && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                  <IC.X className="w-4 h-4 shrink-0" />
                  {deleteStatus}
                </div>
              )}

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || saving}
                className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-100 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer active:scale-0.9"
              >
                {deleting
                  ? <span className="w-4 h-4 border-2 border-red-100/30 border-t-red-100 rounded-full animate-spin" />
                  : <IC.Trash className="w-4 h-4" />}
                {deleting ? "Deleting account..." : "Delete account"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
