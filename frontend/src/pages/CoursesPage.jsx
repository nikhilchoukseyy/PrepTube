import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, getStoredUser, getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";

const ThumbnailImage = ({ videoId, fallbackSrc, alt, className }) => {
  const sources = [
    videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : "",
    videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
    fallbackSrc || "",
  ].filter(Boolean);

  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    setSrcIndex(0);
  }, [videoId, fallbackSrc]);

  if (!sources.length) return null;

  return <img src={sources[srcIndex]} alt={alt} className={className} onError={() => setSrcIndex((index) => Math.min(index + 1, sources.length - 1))} />;
};

const CoursesPage = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joining, setJoining] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  useEffect(() => {
    setPageMeta({
      title: "PrepTube Courses | Your Collaborative Playlists",
      description: "Manage your imported YouTube playlists, join study rooms, and keep your collaborative courses organized.",
    });
  }, []);

  useEffect(() => {
    if (!getToken()) {
      requireAuthRedirect(navigate, "/courses");
      return;
    }
    fetchPlaylists();
  }, [navigate]);

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${API_URL}/playlists/my-playlists`, { headers: authHeaders() });
      setPlaylists(res.data.playlists || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (event) => {
    event.preventDefault();
    if (!playlistUrl.trim()) return;
    setCreating(true);
    setError("");
    try {
      await axios.post(`${API_URL}/playlists/create`, { playlistUrl }, { headers: authHeaders() });
      setPlaylistUrl("");
      fetchPlaylists();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import playlist");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinPlaylist = async () => {
    if (!joinToken.trim()) return;
    setJoining(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/playlists/join`, { token: joinToken.trim() }, { headers: authHeaders() });
      setJoinToken("");
      if (res.data?.playlistId) {
        navigate(`/video/${res.data.playlistId}`);
      } else {
        fetchPlaylists();
      }
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.error === "MEMBER_LIMIT_REACHED") {
        navigate("/pricing", { state: { upgradePrompt: payload.message } });
        return;
      }
      setError(payload?.message || "Failed to join playlist");
    } finally {
      setJoining(false);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm("Delete this playlist for everyone?")) return;
    setDeletingId(playlistId);
    setError("");
    try {
      await axios.delete(`${API_URL}/playlists/${playlistId}`, { headers: authHeaders() });
      setPlaylists((current) => current.filter((playlist) => playlist.playlistId !== playlistId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete playlist");
    } finally {
      setDeletingId("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-white/50">Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-red-200/65">Courses</p>
            <h1 className="text-4xl md:text-5xl font-black mt-3">Your collaborative study library</h1>
            <p className="text-white/65 mt-4 max-w-2xl">Import YouTube playlists, share persistent invite links, and keep everyone moving through the same course together.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-white/35 mb-4">Join a room</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={joinToken} onChange={(event) => setJoinToken(event.target.value)} placeholder="Paste invite token or link" className="flex-1 px-4 py-3 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
              <button onClick={handleJoinPlaylist} disabled={joining || !joinToken.trim()} className="px-5 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-50">
                {joining ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <div>
              <h2 className="text-2xl font-bold">Import a playlist</h2>
              <p className="text-white/45">Create a room from any YouTube playlist URL.</p>
            </div>
            <p className="text-sm text-white/35">Signed in as {currentUser?.username || currentUser?.name || currentUser?.email}</p>
          </div>
          <form onSubmit={handleCreatePlaylist} className="flex flex-col md:flex-row gap-3">
            <input value={playlistUrl} onChange={(event) => setPlaylistUrl(event.target.value)} placeholder="https://www.youtube.com/playlist?list=..." className="flex-1 px-4 py-3 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
            <button type="submit" disabled={creating || !playlistUrl.trim()} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50">
              {creating ? "Importing..." : "Import playlist"}
            </button>
          </form>
          {error ? <p className="text-sm text-red-300 mt-4">{error}</p> : null}
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold">My rooms</h2>
              <p className="text-white/45">{playlists.length} playlist room{playlists.length === 1 ? "" : "s"} available</p>
            </div>
            <Link to="/explore" className="text-sm text-red-300 hover:text-red-200">Explore public playlists</Link>
          </div>

          {playlists.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-white/45">
              No playlists yet. Import your first course or join someone else's room.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {playlists.map((playlist) => {
                const isOwner = String(playlist.owner?.id || playlist.owner?._id || playlist.owner) === String(currentUser?.id);
                return (
                  <article key={playlist.playlistId} className="rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 transition-colors">
                    <Link to={`/video/${playlist.playlistId}`} className="block">
                      <div className="aspect-video bg-black/25 overflow-hidden">
                        {playlist.videos?.[0] ? (
                          <ThumbnailImage videoId={playlist.videos[0].videoId} fallbackSrc={playlist.videos[0].thumbnail} alt={playlist.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30">No preview</div>
                        )}
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xl font-semibold leading-tight">{playlist.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${playlist.isPublic ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/60"}`}>
                            {playlist.isPublic ? "Public" : "Private"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-white/45">
                          <span>{playlist.videos?.length || 0} videos</span>
                          <span>{(playlist.members?.length || 0) + 1} learners</span>
                        </div>
                      </div>
                    </Link>
                    {isOwner ? (
                      <div className="px-5 pb-5 flex justify-end">
                        <button onClick={() => handleDeletePlaylist(playlist.playlistId)} disabled={deletingId === playlist.playlistId} className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50">
                          {deletingId === playlist.playlistId ? "Deleting..." : "Delete room"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CoursesPage;

