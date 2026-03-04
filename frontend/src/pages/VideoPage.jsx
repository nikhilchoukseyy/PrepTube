import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:8000/api';
const SOCKET_URL = 'http://localhost:8000';

const VideoPage = () => {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchPlaylist();
    fetchChatMessages();
    setupSocket(token);

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id, navigate]);

  const setupSocket = (token) => {
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('joinRoom', { playlistId: id });
    });

    newSocket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    setSocket(newSocket);
  };

  const fetchPlaylist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/playlists/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylist(res.data.playlist);
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
        `${API_URL}/playlists/${id}/invite`,
        {},
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

    socket.emit('chatMessage', {
      playlistId: id,
      text: chatMessage
    });
    setChatMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500">{error || 'Playlist not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{playlist.title}</h1>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Progress Stats */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Progress Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {playlist.userStats?.map((stat) => (
              <div key={stat.user._id || stat.user} className="bg-gray-700 p-4 rounded">
                <p className="text-gray-400 text-sm">
                  {stat.user.name || stat.user.email || 'User'}
                </p>
                <p className="text-2xl font-bold">{stat.percent}%</p>
                <p className="text-sm text-gray-400">
                  {stat.completedCount} / {playlist.videos?.length} videos
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.watchedHours}h watched
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Total playlist duration: {playlist.totals?.totalHours}h
          </p>
        </div>

        {/* Invite/Join Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Collaboration</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={handleGenerateInvite}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Generate Invite Link
              </button>
              {inviteLink && (
                <div className="mt-2 p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-400 mb-1">Share this link:</p>
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="w-full px-3 py-1 bg-gray-600 rounded text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  placeholder="Enter invite token to join"
                  className="flex-1 px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleJoinPlaylist}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video List */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Videos ({playlist.videos?.length || 0})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {playlist.videos?.map((video) => (
                <div
                  key={video.videoId}
                  className="bg-gray-700 p-4 rounded flex items-start gap-4"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{video.title}</h3>
                    <p className="text-xs text-gray-400 mb-2">
                      Duration: {video.duration}
                    </p>
                    <button
                      onClick={() => toggleComplete(video.videoId, video.completed)}
                      className={`text-sm px-3 py-1 rounded ${
                        video.completed
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      {video.completed ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-gray-800 p-6 rounded-lg flex flex-col h-[600px]">
            <h2 className="text-xl font-semibold mb-4">Chat</h2>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {messages.map((msg, idx) => (
                <div key={idx} className="bg-gray-700 p-3 rounded">
                  <p className="text-xs text-gray-400 mb-1">
                    {msg.sender?.name || msg.sender?.email || 'User'}
                  </p>
                  <p>{msg.message}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;