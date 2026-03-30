import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import ChatMessage from "../components/ChatMessage";
import StreakBadge from "../components/StreakBadge";
import {
  API_URL,
  SOCKET_URL,
  authHeaders,
  getStoredUser,
  getToken,
  requireAuthRedirect,
} from "../utils/auth";
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

  return (
    <img
      src={sources[srcIndex]}
      alt={alt}
      className={className}
      onError={() => setSrcIndex((index) => Math.min(index + 1, sources.length - 1))}
    />
  );
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
  const [activeTab, setActiveTab] = useState("chat");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [regeneratingInvite, setRegeneratingInvite] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const recorderChunksRef = useRef([]);
  const socketRef = useRef(null);
  const trackingRef = useRef({ lastActiveAt: null, accruedMs: 0 });

  useEffect(() => {
    setPageMeta({
      title: "Playlist Workspace | PrepTube",
      description: "Watch, discuss, and track progress together inside your PrepTube playlist workspace.",
    });
  }, []);

  useEffect(() => {
    if (!getToken()) {
      requireAuthRedirect(navigate, `/video/${id}`);
      return;
    }

    let mounted = true;

    const bootstrap = async () => {
      await Promise.all([fetchPlaylist(), fetchChatMessages()]);
      if (!mounted) return;

      const nextSocket = io(SOCKET_URL, { auth: { token: getToken() } });
      nextSocket.on("connect", () => nextSocket.emit("joinRoom", { playlistId: id }));
      nextSocket.on("newMessage", (message) => setMessages((current) => [...current, message]));
      nextSocket.on("error", (payload) => setError(payload?.message || "Socket error"));
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!playlist) return undefined;

    trackingRef.current.lastActiveAt = document.visibilityState === "visible" ? Date.now() : null;

    const syncElapsed = () => {
      if (trackingRef.current.lastActiveAt) {
        trackingRef.current.accruedMs += Date.now() - trackingRef.current.lastActiveAt;
        trackingRef.current.lastActiveAt = Date.now();
      }
    };

    const flushPeriodically = () => {
      syncElapsed();
      flushTrackedTime();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        syncElapsed();
        trackingRef.current.lastActiveAt = null;
        flushTrackedTime(true);
      } else {
        trackingRef.current.lastActiveAt = Date.now();
      }
    };

    const interval = window.setInterval(flushPeriodically, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", flushPeriodically);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", flushPeriodically);
    };
  }, [playlist]);

  const fetchPlaylist = async () => {
    try {
      const res = await axios.get(`${API_URL}/playlists/${id}/details`, { headers: authHeaders() });
      const nextPlaylist = res.data.playlist;
      setPlaylist(nextPlaylist);
      setSelectedVideo((current) =>
        current
          ? nextPlaylist.videos.find((video) => video.videoId === current.videoId) || nextPlaylist.videos[0]
          : nextPlaylist.videos?.[0] || null
      );
    } catch (err) {
      if (err.response?.status === 403) {
        navigate("/courses");
        return;
      }
      setError(err.response?.data?.message || "Failed to fetch playlist");
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/playlists/${id}/chats`, { headers: authHeaders() });
      setMessages(res.data.chats || []);
    } catch (err) {
      if (err.response?.status === 403) return;
      setError(err.response?.data?.message || "Failed to fetch chat history");
    }
  };

  const flushTrackedTime = async (useKeepAlive = false) => {
    if (!playlist) return;
    const minutesSpent = +(trackingRef.current.accruedMs / 60000).toFixed(2);
    if (!minutesSpent || minutesSpent < 0.1) return;
    trackingRef.current.accruedMs = 0;

    try {
      if (useKeepAlive) {
        await fetch(`${API_URL}/playlists/${id}/time`, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ minutesSpent }),
        });
        return;
      }

      const res = await axios.post(`${API_URL}/playlists/${id}/time`, { minutesSpent }, { headers: authHeaders() });
      setPlaylist((current) =>
        current
          ? {
            ...current,
            requesterProgress: {
              ...current.requesterProgress,
              ...res.data.streak,
            },
          }
          : current
      );
    } catch {
      trackingRef.current.accruedMs += minutesSpent * 60000;
    }
  };

  const toggleComplete = async (videoId, completed) => {
    try {
      const endpoint = completed ? "/playlists/unmark" : "/playlists/mark";
      await axios.post(`${API_URL}${endpoint}`, { playlistId: id, videoId }, { headers: authHeaders() });
      fetchPlaylist();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update progress");
    }
  };

  const handleInvite = async (regenerate = false) => {
    setRegeneratingInvite(regenerate);
    try {
      const res = await axios.post(`${API_URL}/playlists/${id}/invite`, { regenerate }, { headers: authHeaders() });
      setInviteLink(res.data.inviteLink);
      setPlaylist((current) => (current ? { ...current, inviteToken: res.data.token } : current));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to prepare invite link");
    } finally {
      setRegeneratingInvite(false);
    }
  };

  const handleVisibilityToggle = async () => {
    if (!playlist) return;
    setVisibilitySaving(true);
    try {
      const res = await axios.patch(`${API_URL}/playlists/${id}/visibility`, { isPublic: !playlist.isPublic }, { headers: authHeaders() });
      setPlaylist((current) => (current ? { ...current, isPublic: res.data.isPublic } : current));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update visibility");
    } finally {
      setVisibilitySaving(false);
    }
  };

  const handleLeave = async () => {
    try {
      await axios.post(`${API_URL}/playlists/${id}/leave`, {}, { headers: authHeaders() });
      navigate("/courses");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to leave playlist");
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingMemberId(userId);
    try {
      await axios.delete(`${API_URL}/playlists/${id}/members/${userId}`, { headers: authHeaders() });
      await fetchPlaylist();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove member");
    } finally {
      setRemovingMemberId("");
    }
  };

  const emitChatMessage = ({ text = "", messageType = "text", mediaUrl = "" }) => {
    if (!socketRef.current) {
      setError("Chat is still connecting. Please try again.");
      return;
    }

    socketRef.current.emit("chatMessage", {
      playlistId: id,
      text,
      messageType,
      mediaUrl,
    });
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!chatMessage.trim()) return;
    emitChatMessage({ text: chatMessage.trim(), messageType: "text" });
    setChatMessage("");
  };

  const uploadAndSendMedia = async (file) => {
    if (!file) return;
    setUploadingMedia(true);
    setActiveTab("chat");
    try {
      const fileData = await readFileAsDataUrl(file);
      const res = await axios.post(`${API_URL}/playlists/${id}/chat/upload`, { fileData, mimeType: file.type }, { headers: authHeaders() });
      emitChatMessage({ messageType: res.data.messageType, mediaUrl: res.data.mediaUrl });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload media");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recorderChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(recorderChunksRef.current, { type: "audio/webm" }); 
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        await uploadAndSendMedia(file);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("Microphone access was denied.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const progressPercent = useMemo(() => {
    const completedCount = playlist?.videos?.filter((video) => video.completed).length || 0;
    const totalCount = playlist?.videos?.length || 0;
    return totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  }, [playlist]);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading playlist...</div>;
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center text-red-300">{error || "Playlist not found"}</main>
      </div>
    );
  }

  const isOwner = playlist.access?.isOwner;
  const members = playlist.members || [];
  const currentIndex = playlist.videos?.findIndex((video) => video.videoId === selectedVideo?.videoId) ?? -1;
  const nextVideo = currentIndex >= 0 ? playlist.videos[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <section className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          <div className="space-y-5">
            <div className="relative w-full bg-black rounded-[28px] overflow-hidden border border-white/10" style={{ paddingBottom: "56.25%" }}>
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
                <div className="absolute inset-0 flex items-center justify-center text-white/40">Select a video to start</div>
              )}
            </div>

            <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/35 mb-2">{playlist.title}</p>
                  <h1 className="text-2xl md:text-3xl font-black leading-tight">{selectedVideo?.title || "Playlist workspace"}</h1>
                  {selectedVideo ? <p className="text-white/45 mt-2">Video {currentIndex + 1} of {playlist.videos.length} • {selectedVideo.duration}</p> : null}
                </div>
                <div className="flex flex-wrap gap-3 ">
                  {selectedVideo ? (
                    <button onClick={() => toggleComplete(selectedVideo.videoId, selectedVideo.completed)} className={`px-4 py-3 rounded-2xl font-semibold cursor-pointer ${selectedVideo.completed ? "bg-emerald-500 text-black" : "bg-white text-black"}`}>
                      {selectedVideo.completed ? "Completed" : "Mark complete"}
                    </button>
                  ) : null}
                  {nextVideo ? <button onClick={() => setSelectedVideo(nextVideo)} className="px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.05]">Next video</button> : null}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/50">Your progress</span>
                    <span className="text-emerald-300 font-semibold">{progressPercent}% complete</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-lime-300" style={{ width: `${progressPercent}%` }} />
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
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Playlist</p>
                <h2 className="text-lg font-semibold mt-1">{playlist.videos.length} videos</h2>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${playlist.isPublic ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/60"}`}>{playlist.isPublic ? "Public" : "Private"}</span>
            </div>
            <div className="max-h-[700px] overflow-y-auto">
              {playlist.videos.map((video, index) => (
                <button key={video.videoId} onClick={() => setSelectedVideo(video)} className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-4 ${selectedVideo?.videoId === video.videoId ? "border-red-400 bg-white/[0.05]" : "border-transparent hover:bg-white/[0.03]"}`}>
                  <div className="relative shrink-0">
                    <ThumbnailImage videoId={video.videoId} fallbackSrc={video.thumbnail} alt={video.title} className="w-24 h-14 rounded-xl object-cover" />
                    {video.completed ? <div className="absolute inset-0 rounded-xl bg-black/55 flex items-center justify-center text-emerald-300 font-black">?</div> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{index + 1}. {video.title}</p>
                    <p className="text-xs text-white/35 mt-1">{video.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="flex flex-wrap border-b border-white/10">
            {[{ key: "chat", label: "Chat" }, { key: "stats", label: "Stats" }, { key: "collab", label: "Collaborate" }].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-6 py-4 text-sm font-semibold ${activeTab === tab.key ? "text-white border-b-2 border-red-400" : "text-white/45 border-b-2 border-transparent"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "chat" ? (
            <div className="grid lg:grid-rows-[1fr_auto] h-[560px]">
              <div className="overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? <p className="text-white/35 text-sm">No messages yet. Start the conversation.</p> : null}
                {messages.map((message) => <ChatMessage key={message._id || `${message.createdAt}-${message.message}`} message={message} />)}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia} className="px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-sm">
                    {uploadingMedia ? "Uploading..." : "Attach"}
                  </button>
                  <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`px-4 py-3 rounded-2xl text-sm ${isRecording ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.05]"}`}>
                    {isRecording ? "Stop mic" : "Voice"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => uploadAndSendMedia(event.target.files?.[0])} />
                  <input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Send a message..." className="flex-1 px-4 py-3 rounded-2xl bg-black/25 border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
                  <button type="submit" disabled={!chatMessage.trim()} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold disabled:opacity-50">Send</button>
                </div>
                <p className="text-xs text-white/30">Image uploads and voice notes are sent directly into this room. Voice notes use your browser microphone.</p>
              </form>
            </div>
          ) : null}

          {activeTab === "stats" ? (
            <div className="p-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {playlist.userStats?.map((stat) => (
                <article key={stat.user?.id || stat.user?._id} className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    {stat.user?.avatar ? <img src={stat.user.avatar} alt={stat.user.username} className="w-10 h-10 rounded-full object-cover" /> : null}
                    <div>
                      <p className="font-semibold">@{stat.user?.username || stat.user?.name}</p>
                      <p className="text-xs text-white/35">{stat.user?.email}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{stat.completedCount} / {playlist.videos.length} videos</span>
                      <span>{stat.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-400" style={{ width: `${stat.percent}%` }} />
                    </div>
                  </div>
                  <div className="text-sm text-white/55 space-y-1">
                    <p>{stat.watchedHours}h watched</p>
                    <p>Current streak: {stat.currentStreak} day{stat.currentStreak === 1 ? "" : "s"}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {activeTab === "collab" ? (
            <div className="p-6 grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Invite link</h3>
                      <p className="text-sm text-white/45">Persistent invite link for this playlist room.</p>
                    </div>
                    {isOwner ? <button onClick={() => handleInvite(false)} className="px-4 py-2 rounded-2xl bg-white text-black text-sm font-semibold">Get link</button> : null}
                  </div>
                  {inviteLink ? (
                    <div className="space-y-3">
                      <input value={inviteLink} readOnly className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm" />
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => navigator.clipboard.writeText(inviteLink)} className="px-4 py-2 rounded-2xl border border-white/10 text-sm">Copy</button>
                        {isOwner ? <button onClick={() => handleInvite(true)} disabled={regeneratingInvite} className="px-4 py-2 rounded-2xl border border-red-500/30 text-sm text-red-200 disabled:opacity-50">{regeneratingInvite ? "Regenerating..." : "Regenerate"}</button> : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/35">Generate a link to invite collaborators.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Visibility</h3>
                      <p className="text-sm text-white/45">Public rooms show up in Explore for any PrepTube user.</p>
                    </div>
                    {isOwner ? <button onClick={handleVisibilityToggle} disabled={visibilitySaving} className={`px-4 py-2 rounded-2xl text-sm font-semibold ${playlist.isPublic ? "bg-emerald-500 text-black" : "bg-white text-black"}`}>{visibilitySaving ? "Saving..." : playlist.isPublic ? "Make private" : "Make public"}</button> : <span className="text-sm text-white/50">Owner only</span>}
                  </div>
                </div>

                {!isOwner ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
                    <h3 className="text-lg font-semibold">Leave playlist</h3>
                    <p className="text-sm text-white/45">You will lose access to this room, but your existing progress will stay on record.</p>
                    <button onClick={handleLeave} className="px-4 py-3 rounded-2xl border border-red-500/30 text-red-200">Leave room</button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Members</h3>
                    <p className="text-sm text-white/45">Owner plus current collaborators.</p>
                  </div>
                  <span className="text-sm text-white/50">{members.length + 1} total</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      {playlist.owner?.avatar ? <img src={playlist.owner.avatar} alt={playlist.owner.username} className="w-10 h-10 rounded-full object-cover" /> : null}
                      <div>
                        <p className="font-semibold">@{playlist.owner?.username || playlist.owner?.name}</p>
                        <p className="text-xs text-white/35">Owner</p>
                      </div>
                    </div>
                  </div>
                  {members.map((member) => (
                    <div key={member.id || member._id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        {member.avatar ? <img src={member.avatar} alt={member.username} className="w-10 h-10 rounded-full object-cover" /> : null}
                        <div>
                          <p className="font-semibold">@{member.username || member.name}</p>
                          <p className="text-xs text-white/35">{member.email}</p>
                        </div>
                      </div>
                      {isOwner ? <button onClick={() => handleRemoveMember(member.id || member._id)} disabled={removingMemberId === (member.id || member._id)} className="text-sm text-red-200 disabled:opacity-50">{removingMemberId === (member.id || member._id) ? "Removing..." : "Remove"}</button> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="fixed bottom-6 right-6 max-w-sm rounded-2xl bg-red-600 text-white px-5 py-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm">{error}</p>
              <button onClick={() => setError("")} className="text-white/80">×</button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default VideoPage;

