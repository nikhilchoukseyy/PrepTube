import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import UpgradePromptBanner from "../components/UpgradePromptBanner";
import { API_URL, authHeaders, getStoredUser, getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { dedupePlaylistTopics } from "../utils/playlistTopics";
import { IC } from "./Icons";

const ThumbnailImage = ({ videoId, fallbackSrc, alt, className }) => {
  const sources = [
    videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : "",
    videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
    fallbackSrc || "",
  ].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  useEffect(() => { setSrcIndex(0); }, [videoId, fallbackSrc]);
  if (!sources.length) return null;
  return (
    <img
      src={sources[srcIndex]} alt={alt} className={className}
      onError={() => setSrcIndex((i) => Math.min(i + 1, sources.length - 1))}
    />
  );
};

const TopicChips = ({ topics = [], limit = 3 }) => {
  const normalizedTopics = dedupePlaylistTopics(topics);
  if (!normalizedTopics.length) return null;
  const visible = normalizedTopics.slice(0, limit);
  const remaining = normalizedTopics.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((topic) => (
        <span key={topic} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-white/60 tracking-wide">
          {topic}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-semibold text-white/35">
          +{remaining}
        </span>
      )}
    </div>
  );
};

// Divider with label
const OrDivider = () => (
  <div className="flex items-center gap-3 shrink-0">
    <div className="hidden sm:block w-px h-8 bg-white/10" />
    <span className="sm:hidden flex-1 h-px bg-white/10" />
    <span className="text-[11px] uppercase tracking-[0.2em] text-white/25 font-semibold shrink-0">or</span>
    <span className="sm:hidden flex-1 h-px bg-white/10" />
  </div>
);

const CoursesPage = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importWarning, setImportWarning] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joining, setJoining] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [upgradePrompt, setUpgradePrompt] = useState("");
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  useEffect(() => {
    setPageMeta({
      title: "PrepTube Courses | Your Collaborative Playlists",
      description: "Manage your imported YouTube playlists, join study rooms, and keep your collaborative courses organized.",
    });
  }, []);

  useEffect(() => {
    if (!getToken()) { requireAuthRedirect(navigate, "/courses"); return; }
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
    setCreating(true); setError(""); setUpgradePrompt(""); setImportWarning("");
    try {
      const res = await axios.post(`${API_URL}/playlists/create`, { playlistUrl }, { headers: authHeaders() });
      if (res.data?.warning?.code === "PLAYLIST_ALREADY_PUBLIC") {
        setImportWarning(res.data.warning.message || "This playlist is already public in Explore by another user.");
      }
      setPlaylistUrl(""); fetchPlaylists();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import playlist");
    } finally { setCreating(false); }
  };

  const handleJoinPlaylist = async () => {
    if (!joinToken.trim()) return;
    setJoining(true); setError(""); setUpgradePrompt("");
    try {
      const res = await axios.post(`${API_URL}/playlists/join`, { token: joinToken.trim() }, { headers: authHeaders() });
      setJoinToken("");
      if (res.data?.playlistId) navigate(`/video/${res.data.playlistId}`);
      else fetchPlaylists();
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.error === "MEMBER_LIMIT_REACHED") {
        setUpgradePrompt("This room is full on the free plan.");
        return;
      }
      setError(payload?.message || "Failed to join playlist");
    } finally { setJoining(false); }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm("Delete this playlist for everyone?")) return;
    setDeletingId(playlistId); setError(""); setUpgradePrompt("");
    try {
      await axios.delete(`${API_URL}/playlists/${playlistId}`, { headers: authHeaders() });
      setPlaylists((cur) => cur.filter((p) => p.playlistId !== playlistId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete playlist");
    } finally { setDeletingId(""); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-medium">Loading your courses...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[400px] bg-red-600/[0.07] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-orange-500/[0.05] rounded-full blur-[120px]" />
      </div>

      <Navbar />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">

        {/* ── Hero ── */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-red-400/70 text-[11px] uppercase tracking-[0.2em] font-semibold">
            <IC.BookOpen className="w-3.5 h-3.5" /> Courses
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Your collaborative<br className="hidden sm:block" /> study library
            </h1>
            <p className="text-white/40 text-sm font-medium max-w-xs sm:text-right">
              Signed in as <span className="text-white/60 font-semibold">@{currentUser?.username || currentUser?.name}</span>
            </p>
          </div>
          <p className="text-white/45 text-sm sm:text-base font-medium max-w-2xl">
            Import playlists, share invite links, and keep everyone moving through the same course together.
          </p>
        </section>

        {/* ── Unified action bar: Import + Join in one row ── */}
        <section className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] p-4 sm:p-6 backdrop-blur-sm">
          {/* Section label row */}
          <div className="flex items-center gap-4 mb-4 sm:mb-5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold flex items-center gap-1.5">
              <IC.Plus className="w-3.5 h-3.5 text-red-400" /> Import a playlist
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold flex items-center gap-1.5">
              <IC.Link2 className="w-3.5 h-3.5 text-white/40" /> Join a room
            </span>
          </div>

          {upgradePrompt && <UpgradePromptBanner message={upgradePrompt} className="mb-4" />}
          {importWarning && (
            <div className="mb-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3">
              <div className="flex items-start gap-2.5 text-left text-sky-100">
                <IC.Globe className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Already public in Explore</p>
                  <p className="mt-1 text-sm font-medium text-sky-100/80">{importWarning}</p>
                </div>
                <button onClick={() => setImportWarning("")} className="ml-auto text-sky-100/50 hover:text-sky-100">
                  <IC.X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Single unified row */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">

            {/* Import input + button */}
            <form
              onSubmit={handleCreatePlaylist}
              className="flex flex-1 items-center gap-2 min-w-0"
            >
              <div className="relative flex-1 min-w-0">
                <IC.Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400/60 pointer-events-none" />
                <input
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="youtube.com/playlist?list=..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !playlistUrl.trim()}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50 text-sm shadow-lg shadow-red-500/20 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer active:scale-0.9"
              >
                {creating
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <IC.Play className="w-4 h-4" />}
                <span className="hidden sm:inline">{creating ? "Importing..." : "Import"}</span>
                <span className="sm:hidden">{creating ? "..." : "Import"}</span>
              </button>
            </form>

            <OrDivider />

            {/* Join input + button */}
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <div className="relative flex-1 min-w-0">
                <IC.Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinPlaylist()}
                  placeholder="Paste invite token or link"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm font-medium"
                />
              </div>
              <button
                onClick={handleJoinPlaylist}
                disabled={joining || !joinToken.trim()}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-50 text-sm hover:bg-white/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer active:scale-0.9"
              >
                {joining
                  ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  : <IC.ArrowRight className="w-4 h-4" />}
                <span className="hidden sm:inline">{joining ? "Joining..." : "Join"}</span>
                <span className="sm:hidden">{joining ? "..." : "Join"}</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-300 mt-3.5 font-medium bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5">
              <IC.X className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError("")} className="ml-auto text-red-300/50 hover:text-red-300">
                <IC.X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* ── My Rooms grid ── */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <IC.BookOpen className="w-4 h-4 text-white/35" /> My rooms
              </h2>
              <p className="text-white/35 text-sm font-medium mt-0.5">
                {playlists.length} playlist room{playlists.length === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              to="/explore"
              className="flex items-center gap-1.5 text-sm text-red-300/80 hover:text-red-300 font-semibold transition-colors"
            >
              <IC.Compass className="w-3.5 h-3.5" /> Explore
            </Link>
          </div>

          {playlists.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] p-12 sm:p-16 text-center">
              <IC.BookOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/35 text-sm font-medium">No playlists yet.</p>
              <p className="text-white/20 text-xs mt-1 font-medium">Import your first course or join someone else's room above.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {playlists.map((playlist) => {
                const isOwner = String(playlist.owner?.id || playlist.owner?._id || playlist.owner) === String(currentUser?.id);
                const completed = playlist.requesterProgress?.completedCount ?? playlist.videos?.filter((v) => v.completed).length ?? 0;
                const total = playlist.videos?.length || 0;
                const percent = playlist.requesterProgress?.completionPercent ?? (total ? Math.round((completed / total) * 100) : 0);

                return (
                  <article
                    key={playlist.playlistId}
                    className="rounded-[24px] sm:rounded-[28px] border border-white/[0.08] bg-white/[0.03] overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 group flex flex-col"
                  >
                    <Link to={`/video/${playlist.playlistId}`} className="block flex-1">
                      {/* Thumbnail */}
                      <div className="aspect-video bg-black/40 overflow-hidden relative">
                        {playlist.videos?.[0] ? (
                          <ThumbnailImage
                            videoId={playlist.videos[0].videoId}
                            fallbackSrc={playlist.videos[0].thumbnail}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IC.Play className="w-8 h-8 text-white/10" />
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm ${playlist.isPublic ? "bg-emerald-500/80 text-white" : "bg-black/60 border border-white/10 text-white/50"}`}>
                            {playlist.isPublic ? "Public" : "Private"}
                          </span>
                          {isOwner && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-400/80 text-black backdrop-blur-sm">
                              Owner
                            </span>
                          )}
                        </div>

                        {/* Progress bar on thumbnail bottom */}
                        {total > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold leading-snug line-clamp-2">
                            {playlist.title}
                          </h3>
                          {playlist.topics?.length > 0 && (
                            <div className="mt-2">
                              <TopicChips topics={playlist.topics} />
                            </div>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-white/35 font-medium">
                            <span className="flex items-center gap-1.5">
                              <IC.Play className="w-3 h-3" />
                              {total} video{total !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <IC.Users className="w-3 h-3" />
                              {(playlist.members?.length || 0) + 1}
                            </span>
                          </div>
                          {total > 0 && (
                            <span className={`text-xs font-semibold ${percent === 100 ? "text-emerald-400" : "text-white/40"}`}>
                              {percent}%
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Owner delete action */}
                    {isOwner && (
                      <div className="px-4 sm:px-5 pb-4 flex justify-end border-t border-white/[0.05] pt-3">
                        <button
                          onClick={() => handleDeletePlaylist(playlist.playlistId)}
                          disabled={deletingId === playlist.playlistId}
                          className="flex items-center gap-1.5 text-xs text-white/25 hover:text-red-400 disabled:opacity-50 transition-colors font-medium cursor-pointer active:scale-0.9"
                        >
                          <IC.Trash className="w-3.5 h-3.5" />
                          {deletingId === playlist.playlistId ? "Deleting..." : "Delete room"}
                        </button>
                      </div>
                    )}
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
