import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppImage from "../components/AppImage";
import Navbar from "../components/Navbar";
import UpgradePromptBanner from "../components/UpgradePromptBanner";
import { API_URL, authHeaders, getStoredUser, getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { buildPlaylistTopicOptions, dedupePlaylistTopics } from "../utils/playlistTopics";
import { IC } from "./Icons";

const PublicPage = () => {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === "admin";
  const [playlists, setPlaylists] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgradePrompt, setUpgradePrompt] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: "Public Courses | PrepTube",
      description: "Browse public collaborative playlists on PrepTube and join active learning rooms.",
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/playlists/public`);
        const nextPlaylists = res.data.playlists || [];
        setPlaylists(nextPlaylists);
        setAvailableTopics(
          buildPlaylistTopicOptions(
            res.data.availableTopics || nextPlaylists.flatMap((playlist) => playlist.topics || [])
          )
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load public courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPlaylists = useMemo(() => {
    if (!selectedTopics.length) return playlists;

    const selectedTopicSet = new Set(selectedTopics.map((topic) => topic.toLowerCase()));
    return playlists.filter((playlist) =>
      dedupePlaylistTopics(playlist.topics || []).some((topic) => selectedTopicSet.has(topic.toLowerCase()))
    );
  }, [playlists, selectedTopics]);

  const toggleTopic = (topic) => {
    setSelectedTopics((current) =>
      current.includes(topic)
        ? current.filter((value) => value !== topic)
        : [...current, topic]
    );
  };

  const handleJoin = async (playlistId) => {
    if (!getToken()) { requireAuthRedirect(navigate, "/public"); return; }
    try {
      setUpgradePrompt("");
      const res = await axios.post(`${API_URL}/playlists/join`, { playlistId }, { headers: authHeaders() });
      navigate(`/video/${res.data.playlistId || playlistId}`);
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.error === "MEMBER_LIMIT_REACHED") {
        setUpgradePrompt("This room is full on the free plan.");
        return;
      }
      setError(payload?.message || "Unable to join this playlist");
    }
  };

  const handleOpen = (playlistId) => {
    if (!getToken()) { requireAuthRedirect(navigate, "/public"); return; }
    navigate(`/video/${playlistId}`);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7 sm:space-y-8">

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red-300/60 text-xs uppercase tracking-[0.18em] font-medium">
            <IC.Compass className="w-3.5 h-3.5" /> Public
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">Public course rooms from the community</h1>
          <p className="text-white/55 text-sm sm:text-base font-medium max-w-2xl">
            {isAdmin
              ? "Browse public playlists, open any room directly, and moderate community spaces without joining them."
              : "Browse public playlists, join a room in one click, and turn useful YouTube content into a shared learning environment."}
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-semibold">Filter by topics</h2>
              <p className="text-xs text-white/40 font-medium mt-1">Select one or more topics to narrow the public course feed.</p>
            </div>
            {selectedTopics.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTopics([])}
                className="w-fit rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.05] cursor-pointer active:scale-0.9"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {availableTopics.map((topic) => {
              const active = selectedTopics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-red-400/60 bg-red-500/15 text-red-100"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
                  } cursor-pointer active:scale-0.9`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </section>

        {upgradePrompt && <UpgradePromptBanner message={upgradePrompt} />}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-300 font-medium bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
            <IC.X className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-white/40 text-sm font-medium">
            <span className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            Loading public feed...
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-12 sm:p-16 text-center">
            <IC.Globe className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/35 text-sm font-medium">
              {playlists.length === 0 ? "No public playlists yet. Be the first to share one!" : "No public playlists match the selected topics."}
            </p>
          </div>
        ) : (
          <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredPlaylists.map((playlist) => {
              const playlistTopics = dedupePlaylistTopics(playlist.topics || []);

              return (
                <article key={playlist.playlistId} className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors group flex flex-col">
                  <div className="aspect-video bg-black/30 overflow-hidden relative">
                    {playlist.thumbnail ? (
                      <AppImage
                        src={playlist.thumbnail}
                        alt={playlist.title}
                        width={1280}
                        height={720}
                        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IC.Play className="w-8 h-8 text-white/15" />
                      </div>
                    )}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <IC.Users className="w-3 h-3 text-white/60" />
                      <span className="text-[10px] text-white/60 font-medium">{playlist.memberCount}</span>
                    </div>
                  </div>

                  <div onClick={() => (isAdmin ? handleOpen(playlist.playlistId) : handleJoin(playlist.playlistId))} className="p-4 sm:p-5 flex flex-col flex-1 gap-3 cursor-pointer">
                    <div className="flex-1">
                      <h2 className="text-base font-semibold leading-snug line-clamp-2">{playlist.title}</h2>
                      <p className="text-xs text-white/40 mt-1.5 font-medium flex items-center gap-1.5">
                        <IC.User className="w-3 h-3" />
                        @{playlist.owner?.username || playlist.owner?.name || "creator"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {playlistTopics.length > 0 ? (
                          playlistTopics.slice(0, 4).map((topic) => (
                            <span key={topic} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/70">
                              {topic}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-white/25 font-medium">Owner has not added topics yet.</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/40 font-medium">
                      <span className="flex items-center gap-1.5"><IC.Play className="w-3 h-3" />{playlist.videoCount} videos</span>
                      <span className="flex items-center gap-1.5"><IC.Users className="w-3 h-3" />{playlist.memberCount} learners</span>
                    </div>

                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 active:bg-white/80 transition-colors text-sm cursor-pointer active:scale-0.9"
                    >
                      <IC.ArrowRight className="w-3.5 h-3.5" /> {isAdmin ? "Open room" : "Join room"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default PublicPage;
