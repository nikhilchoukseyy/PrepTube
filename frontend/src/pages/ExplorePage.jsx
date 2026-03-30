import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";

const ExplorePage = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: "Explore Public Courses | PrepTube",
      description: "Browse public collaborative playlists on PrepTube and join active learning rooms.",
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/playlists/explore`);
        setPlaylists(res.data.playlists || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load public courses");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleJoin = async (playlistId) => {
    if (!getToken()) {
      requireAuthRedirect(navigate, "/explore");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/playlists/join`, { playlistId }, { headers: authHeaders() });
      navigate(`/video/${res.data.playlistId || playlistId}`);
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.error === "MEMBER_LIMIT_REACHED") {
        navigate("/pricing", { state: { upgradePrompt: payload.message } });
        return;
      }
      setError(payload?.message || "Unable to join this playlist");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-red-200/60">Explore</p>
            <h1 className="text-4xl font-black mt-3">Public course rooms from the community</h1>
            <p className="text-white/65 mt-4 max-w-2xl">Browse public playlists, join a room in one click, and turn useful YouTube content into a shared learning environment.</p>
          </div>
        </section>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        {loading ? (
          <div className="text-white/50">Loading explore feed...</div>
        ) : playlists.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-white/45">
            No public playlists yet.
          </div>
        ) : (
          <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {playlists.map((playlist) => (
              <article key={playlist.playlistId} className="rounded-[28px] overflow-hidden border border-white/10 bg-white/[0.03]">
                <div className="aspect-video bg-black/30 overflow-hidden">
                  {playlist.thumbnail ? <img src={playlist.thumbnail} alt={playlist.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30">No preview</div>}
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">{playlist.title}</h2>
                    <p className="text-sm text-white/45 mt-2">By @{playlist.owner?.username || playlist.owner?.name || "creator"}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/50">
                    <span>{playlist.videoCount} videos</span>
                    <span>{playlist.memberCount} learners</span>
                  </div>
                  <button onClick={() => handleJoin(playlist.playlistId)} className="w-full px-4 py-3 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition-colors">
                    Join room
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default ExplorePage;

