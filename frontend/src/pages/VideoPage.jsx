import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const VideoPage = () => {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null); // ← currently playing video
  const [activeTab, setActiveTab] = useState('videos');     // ← 'videos' | 'chat' | 'stats' | 'collab'
  const chatEndRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetchPlaylist();
    fetchChatMessages();
    const newSocket = setupSocket(token);

    // ✅ Fixed socket cleanup — captures local reference, not stale state
    return () => { newSocket?.disconnect(); };
  }, [id]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setupSocket = (token) => {
    const newSocket = io(SOCKET_URL, { auth: { token } });

    newSocket.on('connect', () => {
      newSocket.emit('joinRoom', { playlistId: id });
    });

    newSocket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    setSocket(newSocket);
    return newSocket; // ✅ return for cleanup
  };

  const fetchPlaylist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/playlists/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.playlist;
      setPlaylist(data);
      // Auto-select first video
      if (data.videos?.length > 0) setSelectedVideo(data.videos[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch playlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/playlists/${id}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.chats || []);
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    }
  };

  const toggleComplete = async (videoId, isCompleted) => {
    try {
      const token = sessionStorage.getItem('token');
      const endpoint = isCompleted ? '/playlists/unmark' : '/playlists/mark';
      await axios.post(
        `${API_URL}${endpoint}`,
        { playlistId: id, videoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPlaylist();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update video status');
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/playlists/${id}/invite`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteLink(res.data.inviteLink);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invite');
    }
  };

  const handleJoinPlaylist = async () => {
    if (!joinToken.trim()) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${API_URL}/playlists/join`,
        { token: joinToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoinToken('');
      fetchPlaylist();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join playlist');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !socket) return;
    socket.emit('chatMessage', { playlistId: id, text: chatMessage });
    setChatMessage('');
  };

  // Find index of current video for "next video" feature
  const currentIndex = playlist?.videos?.findIndex(v => v.videoId === selectedVideo?.videoId) ?? -1;
  const nextVideo = playlist?.videos?.[currentIndex + 1] || null;

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm tracking-widest uppercase">Loading playlist...</p>
      </div>
    </div>
  );

  if (!playlist) return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <p className="text-6xl mb-4">⚠️</p>
          <p className="text-red-400 text-xl">{error || 'Playlist not found'}</p>
          <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
            Go Home
          </button>
        </div>
      </div>
    </div>
  );

  const completedCount = playlist.videos?.filter(v => v.completed).length || 0;
  const totalCount = playlist.videos?.length || 0;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans">
      <Navbar />

      <div className="max-w-[1600px] mx-auto px-4 py-6">

        {/* ── TOP: Video Player + Playlist Sidebar ── */}
        <div className="flex flex-col xl:flex-row gap-6 mb-6">

          {/* Left: Video Player */}
          <div className="flex-1 min-w-0">
            {/* Embed Player */}
            <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
              {selectedVideo ? (
                <iframe
                  key={selectedVideo.videoId} // re-mount iframe when video changes
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                  <p>Select a video to play</p>
                </div>
              )}
            </div>

            {/* Video Info Bar */}
            {selectedVideo && (
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold leading-snug">{selectedVideo.title}</h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {currentIndex + 1} / {totalCount} · {selectedVideo.duration}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {/* Mark complete button */}
                  <button
                    onClick={() => toggleComplete(selectedVideo.videoId, selectedVideo.completed)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedVideo.completed
                        ? 'bg-green-600 hover:bg-red-600 hover:text-white'
                        : 'bg-gray-700 hover:bg-green-600'
                    }`}
                  >
                    {selectedVideo.completed ? '✓ Completed' : 'Mark Complete'}
                  </button>
                  {/* Next video */}
                  {nextVideo && (
                    <button
                      onClick={() => setSelectedVideo(nextVideo)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Overall Progress Bar */}
            <div className="mt-5 bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Your Progress</span>
                <span className="font-semibold text-green-400">{progressPercent}% · {completedCount}/{totalCount} videos</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Video List Sidebar */}
          <div className="xl:w-[380px] shrink-0 bg-gray-900 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">
                Playlist · {totalCount} videos
              </h2>
            </div>
            <div className="overflow-y-auto flex-1">
              {playlist.videos?.map((video, idx) => (
                <div
                  key={video.videoId}
                  onClick={() => setSelectedVideo(video)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-4 ${
                    selectedVideo?.videoId === video.videoId
                      ? 'bg-gray-800 border-red-500'
                      : 'border-transparent hover:bg-gray-800/50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-14 object-cover rounded-lg"
                    />
                    {video.completed && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <span className="text-green-400 text-lg">✓</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug line-clamp-2 ${
                      selectedVideo?.videoId === video.videoId ? 'text-white' : 'text-gray-300'
                    }`}>
                      {idx + 1}. {video.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{video.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM TABS ── */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-800">
            {[
              { key: 'chat', label: '💬 Chat' },
              { key: 'stats', label: '📊 Stats' },
              { key: 'collab', label: '🤝 Collaborate' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Chat */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-600 py-12">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {(msg.sender?.name || msg.sender?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%]">
                      <p className="text-xs text-gray-400 mb-1 font-medium">
                        {msg.sender?.name || msg.sender?.email || 'User'}
                      </p>
                      <p className="text-sm text-gray-100">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 flex gap-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 px-4 py-2 bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-600"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl text-sm font-medium transition-all"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Tab: Stats */}
          {activeTab === 'stats' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlist.userStats?.length === 0 && (
                  <p className="text-gray-500 col-span-full text-center py-8">No progress tracked yet.</p>
                )}
                {playlist.userStats?.map((stat) => (
                  <div key={stat.user._id || stat.user} className="bg-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                        {(stat.user.name || stat.user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{stat.user.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{stat.user.email}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{stat.completedCount} / {totalCount} videos</span>
                        <span className="font-bold text-white">{stat.percent}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${stat.percent}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{stat.watchedHours}h watched</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-500">
                Total playlist duration: <span className="text-white font-medium">{playlist.totals?.totalHours}h</span>
              </div>
            </div>
          )}

          {/* Tab: Collaborate */}
          {activeTab === 'collab' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generate invite */}
              <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="font-semibold mb-1">Generate Invite Link</h3>
                <p className="text-sm text-gray-400 mb-4">Share this link so others can join your playlist room.</p>
                <button
                  onClick={handleGenerateInvite}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-all"
                >
                  Generate Link
                </button>
                {inviteLink && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1">Share this:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(inviteLink)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Join with token */}
              <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="font-semibold mb-1">Join a Playlist</h3>
                <p className="text-sm text-gray-400 mb-4">Enter an invite token to join someone else's playlist room.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    placeholder="Paste invite token..."
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleJoinPlaylist}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global error toast */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm flex gap-3 items-center">
            {error}
            <button onClick={() => setError('')} className="text-white/70 hover:text-white">✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;