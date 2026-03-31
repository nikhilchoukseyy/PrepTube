import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import ChatMessage from "../components/ChatMessage";
import StreakBadge from "../components/StreakBadge";
import { API_URL, SOCKET_URL, authHeaders, getStoredUser, getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { MAX_PLAYLIST_TOPICS, buildPlaylistTopicOptions, dedupePlaylistTopics, normalizeTopicLabel, sameTopicSet } from "../utils/playlistTopics";
import { IC } from "./Icons";
const imageCompression = (await import('browser-image-compression')).default

const ThumbnailImage = ({ videoId, fallbackSrc, alt, className }) => {
  const sources = [
    videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : "",
    videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "",
    fallbackSrc || "",
  ].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  useEffect(() => { setSrcIndex(0); }, [videoId, fallbackSrc]);
  if (!sources.length) return null;
  return <img src={sources[srcIndex]} alt={alt} className={className} onError={() => setSrcIndex((i) => Math.min(i + 1, sources.length - 1))} />;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatDateTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const TABS = [
  { key: "notes", label: "Notes", icon: IC.BookOpen },
  { key: "chat", label: "Chat", icon: IC.MessageSquare },
  { key: "stats", label: "Stats", icon: IC.BarChart },
  { key: "collab", label: "Collaborate", icon: IC.Users },
];

const getEntityId = (value) => value?.id || value?._id || "";

const TOPIC_LIMIT_HINT = `${MAX_PLAYLIST_TOPICS} topics max`;

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("notes");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [topicSaving, setTopicSaving] = useState(false);
  const [topicDrafts, setTopicDrafts] = useState([]);
  const [customTopicDraft, setCustomTopicDraft] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [regeneratingInvite, setRegeneratingInvite] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const recorderChunksRef = useRef([]);
  const socketRef = useRef(null);
  const trackingRef = useRef({ lastActiveAt: null, accruedMs: 0 });

  useEffect(() => {
    setPageMeta({ title: "Playlist Workspace | PrepTube", description: "Watch, discuss, and track progress together inside your PrepTube playlist workspace." });
  }, []);

  useEffect(() => {
    if (!getToken()) { requireAuthRedirect(navigate, `/video/${id}`); return; }
    let mounted = true;
    const bootstrap = async () => {
      await Promise.all([fetchPlaylist(), fetchChatMessages()]);
      if (!mounted) return;
      const nextSocket = io(SOCKET_URL, { auth: { token: getToken() } });
      nextSocket.on("connect", () => nextSocket.emit("joinRoom", { playlistId: id }));
      nextSocket.on("newMessage", (msg) => setMessages((cur) => [...cur, msg]));
      nextSocket.on("error", (p) => setError(p?.message || "Socket error"));
      socketRef.current = nextSocket;
    };
    bootstrap();
    return () => {
      mounted = false;
      flushTrackedTime(true);
      socketRef.current?.emit("leaveRoom", { playlistId: id });
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [id, navigate]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    setNoteDraft(selectedVideo?.note || "");
    setNoteFeedback("");
  }, [selectedVideo?.videoId, selectedVideo?.note, selectedVideo?.noteUpdatedAt]);

  useEffect(() => {
    setTopicDrafts(dedupePlaylistTopics(playlist?.topics || []));
    setCustomTopicDraft("");
  }, [playlist?.playlistId, playlist?.topics]);

  useEffect(() => {
    if (!playlist) return undefined;
    trackingRef.current.lastActiveAt = document.visibilityState === "visible" ? Date.now() : null;
    const syncElapsed = () => {
      if (trackingRef.current.lastActiveAt) {
        trackingRef.current.accruedMs += Date.now() - trackingRef.current.lastActiveAt;
        trackingRef.current.lastActiveAt = Date.now();
      }
    };
    const flushPeriodically = () => { syncElapsed(); flushTrackedTime(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") { syncElapsed(); trackingRef.current.lastActiveAt = null; flushTrackedTime(true); }
      else trackingRef.current.lastActiveAt = Date.now();
    };
    const interval = window.setInterval(flushPeriodically, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", flushPeriodically);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisibilityChange); window.removeEventListener("beforeunload", flushPeriodically); };
  }, [playlist]);

  const fetchPlaylist = async () => {
    try {
      const res = await axios.get(`${API_URL}/playlists/${id}/details`, { headers: authHeaders() });
      const next = res.data.playlist;
      setPlaylist(next);
      setSelectedVideo((cur) => cur ? next.videos.find((v) => v.videoId === cur.videoId) || next.videos[0] : next.videos?.[0] || null);
    } catch (err) {
      if (err.response?.status === 403) { navigate("/courses"); return; }
      setError(err.response?.data?.message || "Failed to fetch playlist");
    } finally { setLoading(false); }
  };

  const fetchChatMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/playlists/${id}/chats`, { headers: authHeaders() });
      setMessages(res.data.chats || []);
    } catch (err) { if (err.response?.status === 403) return; setError(err.response?.data?.message || "Failed to fetch chat"); }
  };

  const flushTrackedTime = async (useKeepAlive = false) => {
    if (!playlist) return;
    const minutesSpent = +(trackingRef.current.accruedMs / 60000).toFixed(2);
    if (!minutesSpent || minutesSpent < 0.1) return;
    trackingRef.current.accruedMs = 0;
    try {
      if (useKeepAlive) {
        await fetch(`${API_URL}/playlists/${id}/time`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ minutesSpent }) });
        return;
      }
      const res = await axios.post(`${API_URL}/playlists/${id}/time`, { minutesSpent }, { headers: authHeaders() });
      setPlaylist((cur) => cur ? { ...cur, requesterProgress: { ...cur.requesterProgress, ...res.data.streak } } : cur);
    } catch { trackingRef.current.accruedMs += minutesSpent * 60000; }
  };

  const toggleComplete = async (videoId, completed) => {
    try {
      await axios.post(`${API_URL}${completed ? "/playlists/unmark" : "/playlists/mark"}`, { playlistId: id, videoId }, { headers: authHeaders() });
      fetchPlaylist();
    } catch (err) { setError(err.response?.data?.message || "Failed to update progress"); }
  };

  const handleInvite = async (regenerate = false) => {
    setRegeneratingInvite(regenerate);
    try {
      const res = await axios.post(`${API_URL}/playlists/${id}/invite`, { regenerate }, { headers: authHeaders() });
      setInviteLink(res.data.inviteLink);
      setPlaylist((cur) => cur ? { ...cur, inviteToken: res.data.token } : cur);
    } catch (err) { setError(err.response?.data?.message || "Failed to prepare invite link"); }
    finally { setRegeneratingInvite(false); }
  };

  const persistTopicsAndVisibility = async ({ nextIsPublic, savingMode }) => {
    if (!playlist) return;

    if (savingMode === "visibility") setVisibilitySaving(true);
    if (savingMode === "topics") setTopicSaving(true);

    try {
      const res = await axios.patch(
        `${API_URL}/playlists/${id}/visibility`,
        { isPublic: nextIsPublic, topics: topicDrafts },
        { headers: authHeaders() }
      );

      const nextTopics = dedupePlaylistTopics(res.data.topics || topicDrafts);
      setPlaylist((current) =>
        current
          ? {
            ...current,
            isPublic: res.data.isPublic,
            topics: nextTopics,
          }
          : current
      );
      setTopicDrafts(nextTopics);
      setCustomTopicDraft("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update playlist settings");
    } finally {
      if (savingMode === "visibility") setVisibilitySaving(false);
      if (savingMode === "topics") setTopicSaving(false);
    }
  };

  const handleVisibilityToggle = async () => {
    if (!playlist) return;
    if (!playlist.isPublic && topicDrafts.length === 0) {
      setActiveTab("collab");
      setError("Choose at least one topic before making this playlist public");
      return;
    }

    await persistTopicsAndVisibility({
      nextIsPublic: !playlist.isPublic,
      savingMode: "visibility",
    });
  };

  const handleSaveTopics = async () => {
    if (!playlist) return;
    await persistTopicsAndVisibility({
      nextIsPublic: playlist.isPublic,
      savingMode: "topics",
    });
  };

  const handleTopicToggle = (topic) => {
    setTopicDrafts((current) => {
      if (current.includes(topic)) {
        return current.filter((value) => value !== topic);
      }

      if (current.length >= MAX_PLAYLIST_TOPICS) {
        setError(`You can add up to ${MAX_PLAYLIST_TOPICS} topics per public playlist`);
        return current;
      }

      return dedupePlaylistTopics([...current, topic]);
    });
  };

  const handleAddCustomTopic = () => {
    const nextTopic = normalizeTopicLabel(customTopicDraft);
    if (!nextTopic) return;

    const canonicalTopic =
      availableTopicOptions.find((topic) => topic.toLowerCase() === nextTopic.toLowerCase()) || nextTopic;

    if (topicDrafts.some((topic) => topic.toLowerCase() === canonicalTopic.toLowerCase())) {
      setCustomTopicDraft("");
      return;
    }

    if (topicDrafts.length >= MAX_PLAYLIST_TOPICS) {
      setError(`You can add up to ${MAX_PLAYLIST_TOPICS} topics per public playlist`);
      return;
    }

    setTopicDrafts((current) => dedupePlaylistTopics([...current, canonicalTopic]));
    setCustomTopicDraft("");
  };

  const handleLeave = async () => {
    try { await axios.post(`${API_URL}/playlists/${id}/leave`, {}, { headers: authHeaders() }); navigate("/courses"); }
    catch (err) { setError(err.response?.data?.message || "Unable to leave playlist"); }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingMemberId(userId);
    try { await axios.delete(`${API_URL}/playlists/${id}/members/${userId}`, { headers: authHeaders() }); await fetchPlaylist(); }
    catch (err) { setError(err.response?.data?.message || "Unable to remove member"); }
    finally { setRemovingMemberId(""); }
  };

  const emitChatMessage = ({ text = "", messageType = "text", mediaUrl = "" }) => {
    if (!socketRef.current) { setError("Chat is still connecting. Please try again."); return; }
    socketRef.current.emit("chatMessage", { playlistId: id, text, messageType, mediaUrl });
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!chatMessage.trim()) return;
    emitChatMessage({ text: chatMessage.trim(), messageType: "text" });
    setChatMessage("");
  };

  const uploadAndSendMedia = async (file) => {
    if (!file) return;
    setUploadingMedia(true); setActiveTab("chat");
    try {
      let fileToUpload = file;

      if (file.type.startsWith("image/")) {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: "image/webp",
        });
      } else if (file.type.startsWith("audio/") && file.size > 5 * 1024 * 1024) {
        setError("Audio must be under 5MB");
        return;
      }

      const fileData = await readFileAsDataUrl(fileToUpload);
      const res = await axios.post(
        `${API_URL}/playlists/${id}/chat/upload`,
        { fileData, mimeType: fileToUpload.type },
        { headers: authHeaders() }
      );
      emitChatMessage({ messageType: res.data.messageType, mediaUrl: res.data.mediaUrl });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload media");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const persistVideoNote = async (content) => {
    if (!selectedVideo) return;

    setNoteSaving(true);
    setNoteFeedback("");
    try {
      const res = await axios.put(
        `${API_URL}/playlists/${id}/videos/${selectedVideo.videoId}/note`,
        { content },
        { headers: authHeaders() }
      );

      const savedNote = res.data.note || {
        videoId: selectedVideo.videoId,
        content: "",
        updatedAt: null,
      };

      setPlaylist((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          videos: (cur.videos || []).map((video) =>
            video.videoId === selectedVideo.videoId
              ? {
                ...video,
                note: savedNote.content || "",
                noteUpdatedAt: savedNote.updatedAt || null,
              }
              : video
          ),
        };
      });

      setSelectedVideo((cur) =>
        cur && cur.videoId === selectedVideo.videoId
          ? {
            ...cur,
            note: savedNote.content || "",
            noteUpdatedAt: savedNote.updatedAt || null,
          }
          : cur
      );
      setNoteDraft(savedNote.content || "");
      setNoteFeedback(savedNote.content ? "Note saved." : "Note cleared.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSaveNote = async () => {
    await persistVideoNote(noteDraft);
  };

  const handleClearNote = async () => {
    await persistVideoNote("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // opus codec at 32kbps — ~240KB/min, great voice quality
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });

      recorderChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recorderChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(recorderChunksRef.current, { type: mimeType });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: mimeType });
        await uploadAndSendMedia(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch { setError("Microphone access was denied."); }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state !== "inactive") recorderRef.current.stop();
    setIsRecording(false);
  };

  const progressPercent = useMemo(() => {
    const done = playlist?.videos?.filter((v) => v.completed).length || 0;
    const total = playlist?.videos?.length || 0;
    return total ? Math.round((done / total) * 100) : 0;
  }, [playlist]);

  const rankedStats = useMemo(() => {
    if (!playlist) return [];

    const durationMap = Object.fromEntries((playlist.videos || []).map((video) => [video.videoId, video.durationSeconds || 0]));
    const totalVideos = playlist.videos?.length || 0;
    const statsByUser = new Map();

    for (const stat of playlist.userStats || []) {
      const userId = getEntityId(stat.user);
      if (!userId) continue;

      const existing = statsByUser.get(userId);
      const completedVideos = Array.from(new Set([...(existing?.completedVideos || []), ...(stat.completedVideos || [])]));
      const watchedSeconds = completedVideos.reduce((sum, videoId) => sum + (durationMap[videoId] || 0), 0);
      const completedCount = completedVideos.length;
      const percent = totalVideos ? Math.round((completedCount / totalVideos) * 100) : 0;

      statsByUser.set(userId, {
        ...stat,
        user: existing?.user || stat.user,
        completedVideos,
        completedCount,
        percent,
        watchedSeconds,
        watchedHours: +(watchedSeconds / 3600).toFixed(2),
        currentStreak: Math.max(existing?.currentStreak || 0, stat.currentStreak || 0),
        longestStreak: Math.max(existing?.longestStreak || 0, stat.longestStreak || 0),
        todayMinutes: Math.max(existing?.todayMinutes || 0, stat.todayMinutes || 0),
      });
    }

    return Array.from(statsByUser.values())
      .sort((left, right) =>
        right.percent - left.percent ||
        right.completedCount - left.completedCount ||
        right.watchedSeconds - left.watchedSeconds ||
        right.currentStreak - left.currentStreak ||
        `${left.user?.username || left.user?.name || ""}`.localeCompare(`${right.user?.username || right.user?.name || ""}`)
      )
      .map((stat, index) => ({ ...stat, rank: index + 1 }));
  }, [playlist]);

  const uniqueMembers = useMemo(() => {
    const ownerId = getEntityId(playlist?.owner);
    const seen = new Set();

    return (playlist?.members || []).filter((member) => {
      const memberId = getEntityId(member);
      if (!memberId || memberId === ownerId || seen.has(memberId)) return false;
      seen.add(memberId);
      return true;
    });
  }, [playlist]);

  if (loading) return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-medium">Loading playlist...</p>
      </div>
    </div>
  );

  if (!playlist) return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <IC.X className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 font-medium">{error || "Playlist not found"}</p>
      </main>
    </div>
  );

  const isOwner = playlist.access?.isOwner;
  const members = uniqueMembers;
  const currentIndex = playlist.videos?.findIndex((v) => v.videoId === selectedVideo?.videoId) ?? -1;
  const nextVideo = currentIndex >= 0 ? playlist.videos[currentIndex + 1] : null;
  const normalizedNoteDraft = noteDraft.trim();
  const selectedVideoNote = selectedVideo?.note || "";
  const noteIsDirty = normalizedNoteDraft !== selectedVideoNote;
  const noteUpdatedLabel = formatDateTime(selectedVideo?.noteUpdatedAt);
  const playlistTopics = dedupePlaylistTopics(playlist.topics || []);
  const availableTopicOptions = buildPlaylistTopicOptions([
    ...playlistTopics,
    ...topicDrafts,
  ]);
  const topicsDirty = !sameTopicSet(topicDrafts, playlistTopics);
  const canAddMoreTopics = topicDrafts.length < MAX_PLAYLIST_TOPICS;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* Video + Sidebar layout */}
        <section className="flex flex-col xl:grid xl:grid-cols-[3fr_1fr] gap-4 sm:gap-6 items-start">

          {/* Left: Player + Info */}
          <div className="w-full space-y-4">
            {/* Player */}
            <div className="relative w-full bg-black rounded-[20px] sm:rounded-[28px] overflow-hidden border border-white/10" style={{ paddingBottom: "56.25%" }}>
              {selectedVideo ? (
                <iframe
                  key={selectedVideo.videoId}
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30">
                  <IC.PlayCircle className="w-12 h-12" />
                  <p className="text-sm font-medium">Select a video to start</p>
                </div>
              )}
            </div>

            {/* Video info card */}
            <div className="rounded-[20px] sm:rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-white/30 font-medium uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
                    <IC.BookOpen className="w-3.5 h-3.5" />{playlist.title}
                  </p>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">{selectedVideo?.title || "Playlist workspace"}</h1>
                  {selectedVideo && (
                    <p className="text-white/40 text-sm mt-1.5 font-medium">
                      Video {currentIndex + 1} of {playlist.videos.length} · {selectedVideo.duration}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {playlistTopics.length > 0 ? (
                      playlistTopics.map((topic) => (
                        <span key={topic} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/70">
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-white/25 font-medium">No public topics added yet.</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {selectedVideo && (
                    <button
                      onClick={() => toggleComplete(selectedVideo.videoId, selectedVideo.completed)}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-semibold text-sm cursor-pointer transition-colors ${selectedVideo.completed ? "bg-emerald-500 text-black" : "bg-white text-black hover:bg-white/90"} cursor-pointer active:scale-0.9`}
                    >
                      <IC.Check className={`w-4 h-4 ${selectedVideo.completed ? "text-black" : "text-black"}`} />
                      {selectedVideo.completed ? "Done" : "Mark done"}
                    </button>
                  )}
                  {nextVideo && (
                    <button onClick={() => setSelectedVideo(nextVideo)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer active:scale-0.9">
                      <IC.SkipForward className="w-4 h-4" /> Next
                    </button>
                  )}
                  {/* Mobile sidebar toggle */}
                  <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="xl:hidden flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-medium cursor-pointer active:scale-0.9"
                  >
                    <IC.Play className="w-3.5 h-3.5" /> Playlist ({playlist.videos.length})
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/45 font-medium flex items-center gap-1.5"><IC.BarChart className="w-3.5 h-3.5" />Your progress</span>
                  <span className="text-emerald-300 font-semibold">{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <StreakBadge
                currentStreak={playlist.requesterProgress?.currentStreak || 0}
                longestStreak={playlist.requesterProgress?.longestStreak || 0}
                todayMinutes={playlist.requesterProgress?.todayMinutes || 0}
                timeZone={playlist.requesterProgress?.streakTimezone || "Asia/Kolkata"}
              />
            </div>
          </div>

          {/* Right: Video list sidebar (collapsible on mobile) */}
          <aside className={`w-full xl:block rounded-[20px] sm:rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden ${sidebarOpen ? "block" : "hidden xl:block"}`}>
            <div className="px-4 sm:px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/30 font-medium flex items-center gap-1.5"><IC.BookOpen className="w-3 h-3" />Playlist</p>
                <h2 className="text-base font-semibold mt-0.5">{playlist.videos.length} videos</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${playlist.isPublic ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"}`}>
                  {playlist.isPublic ? "Public" : "Private"}
                </span>
                <button onClick={() => setSidebarOpen(false)} className="xl:hidden text-white/30 hover:text-white/60 p-1 cursor-pointer active:scale-0.9">
                  <IC.X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[50vh] xl:max-h-[700px] overflow-y-auto">
              {playlist.videos.map((video, index) => (
                <button
                  key={video.videoId} onClick={() => { setSelectedVideo(video); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left border-l-4 transition-colors ${selectedVideo?.videoId === video.videoId ? "border-red-400 bg-white/[0.05]" : "border-transparent hover:bg-white/[0.03] cursor-pointer active:scale-0.9"}`}
                >
                  <div className="relative shrink-0">
                    <ThumbnailImage videoId={video.videoId} fallbackSrc={video.thumbnail} alt={video.title} className="w-20 sm:w-24 h-12 sm:h-14 rounded-xl object-cover" loading="lazy" />
                    {video.completed && (
                      <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                        <IC.Check className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium line-clamp-2">{index + 1}. {video.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-[10px] text-white/35 font-medium">{video.duration}</p>
                      {video.note && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                          <IC.BookOpen className="w-2.5 h-2.5" /> Note
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </section>

        {/* Bottom: Tabs */}
        <section className="rounded-[20px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-white/10 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === key ? "text-white border-red-400" : "text-white/40 border-transparent hover:text-white/60 cursor-pointer active:scale-0.9"}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {activeTab === "notes" && (
            <div className="p-4 sm:p-6">
              {selectedVideo ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Video note</p>
                      <h3 className="mt-1 text-base sm:text-lg font-semibold line-clamp-2">{selectedVideo.title}</h3>
                      <p className="mt-1 text-xs text-white/45 font-medium">
                        This is your private note for this video. Other playlist members cannot see it.
                      </p>
                    </div>
                    <div className="shrink-0 text-xs text-white/40 font-medium">
                      {selectedVideo.note ? (
                        <span>
                          {noteUpdatedLabel ? `Last saved ${noteUpdatedLabel}` : "Private to you"}
                        </span>
                      ) : (
                        <span>No private note yet.</span>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={noteDraft}
                    onChange={(e) => {
                      setNoteDraft(e.target.value);
                      if (noteFeedback) setNoteFeedback("");
                    }}
                    maxLength={5000}
                    placeholder="Write the key idea, formula, timestamp, or summary for this video..."
                    className="min-h-[220px] w-full resize-y rounded-[24px] border border-white/10 bg-[#070707] px-4 py-3 text-sm leading-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className="text-white/35">{noteDraft.length}/5000 characters</span>
                      {noteFeedback && <span className="text-emerald-300">{noteFeedback}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearNote}
                        disabled={noteSaving || (!selectedVideo.note && !normalizedNoteDraft)}
                        className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer active:scale-0.9"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNote}
                        disabled={noteSaving || !noteIsDirty}
                        className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer active:scale-0.9"
                      >
                        {noteSaving ? "Saving..." : "Save note"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/35 font-medium">Select a video to write a note.</p>
              )}
            </div>
          )}

          {/* ── Chat tab ── */}
          {activeTab === "chat" && (
            <div className="flex flex-col" style={{ height: "min(560px, 70vh)" }}>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {messages.length === 0 && <p className="text-white/30 text-sm font-medium">No messages yet. Start the conversation.</p>}
                {messages.map((msg) => <ChatMessage key={msg._id || `${msg.createdAt}-${msg.message}`} message={msg} />)}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10 space-y-2.5">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">

                  {/* Row 2 on mobile: Attach + Voice */}
                  <div className="flex items-center gap-2 sm:contents">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-white/10 bg-white/[0.05] text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer active:scale-0.9"
                    >
                      <IC.Paperclip className="w-3.5 h-3.5" />
                      <span className="sm:hidden">Attach</span>
                      <span className="hidden sm:inline">{uploadingMedia ? "Uploading..." : "Attach"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-colors ${isRecording ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.05] hover:bg-white/10 cursor-pointer active:scale-0.9"
                        }`}
                    >
                      <IC.Mic className="w-3.5 h-3.5" />
                      <span>{isRecording ? "Stop" : "Voice"}</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadAndSendMedia(e.target.files?.[0])}
                    />
                  </div>

                  {/* Row 1 on mobile: Input + Send */}
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Send a message..."
                      className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-2xl bg-black/25 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!chatMessage.trim()}
                      className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50 text-sm shrink-0 cursor-pointer active:scale-0.9"
                    >
                      <IC.Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>

                </div>
                <p className="text-[10px] text-white/25 font-medium">Images and voice notes are sent into this room only.</p>
              </form>
            </div>
          )}

          {/* ── Stats tab ── */}
          {activeTab === "stats" && (
            <div className="p-4 sm:p-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {rankedStats.map((stat) => (
                <article key={stat.user?.id || stat.user?._id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {stat.user?.avatar ? (
                        <img src={stat.user.avatar} alt={stat.user.username} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <IC.User className="w-4 h-4 text-white/30" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">@{stat.user?.username || stat.user?.name}</p>
                        <p className="text-[10px] text-white/35 font-medium">{stat.user?.email}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-amber-300">
                      #{stat.rank}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-white/50">{stat.completedCount} / {playlist.videos.length} videos</span>
                      <span className="text-sky-300">{stat.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-400" style={{ width: `${stat.percent}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50 font-medium">
                    <span className="flex items-center gap-1"><IC.BarChart className="w-3 h-3" />{stat.watchedHours}h</span>
                    <span className="flex items-center gap-1"><IC.Flame className="w-3 h-3 text-orange-400" />{stat.currentStreak}d streak</span>
                  </div>
                </article>
              ))}
              {rankedStats.length === 0 && (
                <p className="text-sm text-white/35 font-medium sm:col-span-2 xl:col-span-3">No member progress yet.</p>
              )}
            </div>
          )}

          {/* ── Collab tab ── */}
          {activeTab === "collab" && (
            <div className="p-4 sm:p-6 grid xl:grid-cols-[1fr_1fr] gap-4 sm:gap-5">
              <div className="space-y-3 sm:space-y-4">
                {/* Invite */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2"><IC.Link2 className="w-4 h-4 text-white/40" /> Invite link</h3>
                      <p className="text-xs text-white/40 mt-1 font-medium">Persistent invite link for this room.</p>
                    </div>
                    {isOwner && (
                      <button onClick={() => handleInvite(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white text-black text-xs font-semibold whitespace-nowrap cursor-pointer active:scale-0.9">
                        <IC.Link2 className="w-3.5 h-3.5" /> Get link
                      </button>
                    )}
                  </div>
                  {inviteLink && (
                    <div className="space-y-2.5">
                      <input value={inviteLink} readOnly className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-medium" />
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => navigator.clipboard.writeText(inviteLink)} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 text-xs font-medium hover:bg-white/5 cursor-pointer active:scale-0.9">
                          <IC.Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                        {isOwner && (
                          <button onClick={() => handleInvite(true)} disabled={regeneratingInvite} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-red-500/30 text-xs text-red-200 font-medium disabled:opacity-50 hover:bg-red-500/10 cursor-pointer active:scale-0.9 ">
                            <IC.RefreshCw className="w-3.5 h-3.5" />
                            {regeneratingInvite ? "Regenerating..." : "Regenerate"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {!inviteLink && <p className="text-xs text-white/30 font-medium">Generate a link to invite collaborators.</p>}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {playlist.isPublic ? <IC.Globe className="w-4 h-4 text-emerald-400" /> : <IC.Lock className="w-4 h-4 text-white/40" />}
                        Visibility and topics
                      </h3>
                      <p className="text-xs text-white/40 mt-1 font-medium">Public rooms show up in Explore and require at least one topic.</p>
                    </div>
                    {isOwner ? (
                      <button
                        onClick={handleVisibilityToggle}
                        disabled={visibilitySaving}
                        className={`px-3 py-2 rounded-2xl text-xs font-semibold transition-colors disabled:opacity-50 ${playlist.isPublic ? "bg-emerald-500 text-black" : "bg-white text-black cursor-pointer active:scale-0.9"
                          }`}
                      >
                        {visibilitySaving ? "Saving..." : playlist.isPublic ? "Make private" : "Make public"}
                      </button>
                    ) : <span className="text-xs text-white/30 font-medium">Owner only</span>}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/30 font-semibold">Topics</p>
                      <span className="text-[11px] text-white/30 font-medium">{topicDrafts.length}/{MAX_PLAYLIST_TOPICS}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availableTopicOptions.map((topic) => {
                        const active = topicDrafts.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => isOwner && handleTopicToggle(topic)}
                            disabled={!isOwner || (!active && !canAddMoreTopics)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${active
                                ? "border-red-400/60 bg-red-500/15 text-red-100"
                                : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
                              } cursor-pointer active:scale-0.9`}
                          >
                            {topic}
                          </button>
                        );
                      })}
                    </div>

                    {isOwner ? (
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          value={customTopicDraft}
                          onChange={(event) => setCustomTopicDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddCustomTopic();
                            }
                          }}
                          placeholder="Add a custom topic"
                          disabled={!canAddMoreTopics && !normalizeTopicLabel(customTopicDraft)}
                          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomTopic}
                          disabled={!normalizeTopicLabel(customTopicDraft) || !canAddMoreTopics}
                          className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer active:scale-0.9"
                        >
                          Add topic
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-white/30 font-medium">Only the owner can edit playlist topics.</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-[11px] text-white/35 font-medium">
                        {playlist.isPublic
                          ? "These topics are used in Explore filters right now."
                          : `Choose topics now so the playlist is ready for Explore later. ${TOPIC_LIMIT_HINT}.`}
                      </p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={handleSaveTopics}
                          disabled={topicSaving || !topicsDirty}
                          className="rounded-2xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.05] disabled:opacity-50 cursor-pointer active:scale-0.9"
                        >
                          {topicSaving ? "Saving topics..." : "Save topics"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!isOwner && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                    <h3 className="font-semibold flex items-center gap-2 mb-1"><IC.LogOut className="w-4 h-4 text-red-400" />Leave playlist</h3>
                    <p className="text-xs text-white/40 mb-3 font-medium">You'll lose access but your progress stays.</p>
                    <button onClick={handleLeave} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-red-500/30 text-red-200 text-xs font-medium hover:bg-red-500/10 cursor-pointer active:scale-0.9">
                      <IC.LogOut className="w-3.5 h-3.5" /> Leave room
                    </button>
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2"><IC.Users className="w-4 h-4 text-white/40" />Members</h3>
                    <p className="text-xs text-white/40 mt-0.5 font-medium">Owner + collaborators</p>
                  </div>
                  <span className="text-xs text-white/40 font-medium">{members.length + 1} total</span>
                </div>
                <div className="space-y-2">
                  {/* Owner */}
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    {playlist.owner?.avatar ? (
                      <img src={playlist.owner.avatar} alt={playlist.owner.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><IC.User className="w-4 h-4 text-white/30" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">@{playlist.owner?.username || playlist.owner?.name}</p>
                      <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1"><IC.Crown className="w-2.5 h-2.5" />Owner</span>
                    </div>
                  </div>
                  {members.map((member) => (
                    <div key={member.id || member._id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {member.avatar ? <img src={member.avatar} alt={member.username} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><IC.User className="w-4 h-4 text-white/30" /></div>}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">@{member.username || member.name}</p>
                          <p className="text-[10px] text-white/30 font-medium truncate">{member.email}</p>
                        </div>
                      </div>
                      {isOwner && (
                        <button onClick={() => handleRemoveMember(member.id || member._id)} disabled={removingMemberId === (member.id || member._id)}
                          className="shrink-0 flex items-center gap-1 text-xs text-white/30 cursor-pointer active:scale-0.9 hover:text-red-300 font-medium disabled:opacity-50 transition-colors">
                          <IC.X className="w-3 h-3" />
                          <span className="hidden sm:inline">{removingMemberId === (member.id || member._id) ? "..." : "Remove"}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 max-w-xs sm:max-w-sm w-full rounded-2xl bg-red-600 text-white px-4 sm:px-5 py-3 sm:py-4 shadow-2xl z-50">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError("")} className="shrink-0 text-white/70 cursor-pointer active:scale-0.9 hover:text-white"><IC.X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPage;
