import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, clearStoredAuth, getStoredUser, getToken, requireAuthRedirect, updateStoredUser } from "../utils/auth";
import { setPageMeta } from "../utils/meta";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPageMeta({ title: "Profile | PrepTube", description: "Manage your PrepTube profile, username, avatar, and learning plan." });
  }, []);

  useEffect(() => {
    if (!getToken()) {
      requireAuthRedirect(navigate, "/profile");
      return;
    }

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

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const res = await axios.patch(`${API_URL}/users/profile`, { username, avatar }, { headers: authHeaders() });
      const updatedUser = updateStoredUser(res.data.user);
      setUser(updatedUser);
      setStatus("Profile updated successfully.");
    } catch (err) {
      setStatus(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/");
  };

  const presetAvatars = buildPresetAvatars(username || user?.name || user?.email);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12 grid lg:grid-cols-[0.75fr_1.25fr] gap-6">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center">
          {avatar ? <img src={avatar} alt={username || user?.name || "Profile"} className="w-28 h-28 rounded-full object-cover mx-auto border border-white/10" /> : null}
          <h1 className="text-3xl font-black mt-5">@{user?.username || user?.name}</h1>
          <p className="text-white/45 mt-2">{user?.email}</p>
          <p className="text-sm text-white/40 mt-4">Plan: <span className="text-white">{user?.plan || "free"}</span></p>
          <button onClick={handleLogout} className="mt-8 w-full px-4 py-3 rounded-2xl border border-white/10 text-white/70 hover:text-red-200 hover:border-red-500/30 transition-colors">Sign out</button>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-bold mb-6">Edit profile</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm text-white/55 mb-2">Username</label>
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
            </div>
            <div>
              <label className="block text-sm text-white/55 mb-2">Avatar URL</label>
              <input value={avatar} onChange={(event) => setAvatar(event.target.value)} className="w-full px-4 py-3 rounded-2xl bg-black/25 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
            </div>
            <div>
              <p className="text-sm text-white/55 mb-3">Avatar presets</p>
              <div className="flex flex-wrap gap-3">
                {presetAvatars.map((preset) => (
                  <button key={preset} type="button" onClick={() => setAvatar(preset)} className={`rounded-full border ${avatar === preset ? "border-red-400" : "border-white/10"} p-1`}>
                    <img src={preset} alt="Avatar preset" className="w-14 h-14 rounded-full" />
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Save changes"}
            </button>
            {status ? <p className="text-sm text-white/70">{status}</p> : null}
          </form>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;

