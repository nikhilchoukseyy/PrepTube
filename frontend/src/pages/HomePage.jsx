import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = "http://localhost:5000/api";

const HomePage = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [joinToken, setJoinToken] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchPlaylists();
  }, [navigate]);

  const fetchPlaylists = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_URL}/playlists/my-playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(res.data.playlists || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;
    setCreating(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${API_URL}/playlists/create`,
        { playlistUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylistUrl('');
      setFormOpen(false);
      fetchPlaylists();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinPlaylist = async () => {
    if (!joinToken.trim()) return;
    setJoining(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${API_URL}/playlists/join`,
        { token: joinToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoinToken('');
      fetchPlaylists();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join playlist');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full"
        />
        <p className="text-white/30 text-sm tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 py-10 relative z-10">

        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">My Playlists</h1>
            <p className="text-white/30 text-sm mt-1">
              {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFormOpen(p => !p)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-red-500/20 transition-all duration-200"
          >
            <motion.span
              animate={{ rotate: formOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg leading-none"
            >+</motion.span>
            Add Playlist
          </motion.button>
        </motion.div>

        {/* Create Playlist Form — collapsible */}
        <AnimatePresence>
          {formOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Import YouTube Playlist</h2>
                <form onSubmit={handleCreatePlaylist} className="flex gap-3">
                  <input
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="https://www.youtube.com/playlist?list=..."
                    className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
                  />
                  <motion.button
                    type="submit"
                    disabled={creating}
                    whileHover={{ scale: creating ? 1 : 1.02 }}
                    whileTap={{ scale: creating ? 1 : 0.97 }}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 shadow-lg shadow-red-500/20 transition-all duration-200 whitespace-nowrap"
                  >
                    {creating ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block"
                        />
                        Importing...
                      </span>
                    ) : 'Import'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 flex justify-between items-center"
            >
              {error}
              <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400 ml-4">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlists Grid OR Empty State */}
        {playlists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-6 max-w-md mx-auto"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-4xl">
              📋
            </div>
            <div>
              <h3 className="text-white/70 font-semibold text-lg mb-1">No playlists yet</h3>
              <p className="text-white/25 text-sm">Import a YouTube playlist or join one with a token</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFormOpen(true)}
              className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 text-white/70 rounded-xl text-sm transition-all"
            >
              + Add your first playlist
            </motion.button>

            {/* Divider */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/20 text-xs uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <JoinRoomCard
              joinToken={joinToken}
              setJoinToken={setJoinToken}
              handleJoinPlaylist={handleJoinPlaylist}
              joining={joining}
            />
          </motion.div>
        ) : (
          <>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence>
                {playlists.map((playlist, i) => (
                  <motion.div
                    key={playlist._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      to={`/video/${playlist.playlistId}`}
                      className="block bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-5 transition-all duration-250 group"
                    >
                      <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-red-900/30 to-orange-900/20 mb-4 flex items-center justify-center overflow-hidden border border-white/[0.05]">
                        {playlist.videos?.[0]?.thumbnail ? (
                          <img
                            src={playlist.videos[0].thumbnail}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-3xl opacity-40">▶</span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-white transition-colors">
                        {playlist.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-white/30 mt-auto">
                        <span>{playlist.videos?.length || 0} videos</span>
                        <span className="flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">👤</span>
                          {(playlist.members?.length || 0) + 1} members
                        </span>
                        <span
                      
                        className="text-red-500 hover:text-red-400 cursor-pointer transition-colors">
                          Delete playlist
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Join Room shown below grid when playlists exist */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 max-w-md"
            >
              <JoinRoomCard
                joinToken={joinToken}
                setJoinToken={setJoinToken}
                handleJoinPlaylist={handleJoinPlaylist}
                joining={joining}
              />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Join Room Card ─────────────────────────────────────────────────────── */
const JoinRoomCard = ({ joinToken, setJoinToken, handleJoinPlaylist, joining }) => (
  <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
    <div className="flex items-center gap-3 mb-1">
      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-base">
        🔗
      </div>
      <h3 className="text-white font-semibold text-sm">Join a Playlist Room</h3>
    </div>
    <p className="text-white/25 text-xs mb-5 pl-11">
      Enter an invite token to join someone's playlist.
    </p>
    <div className="flex gap-3">
      <input
        type="text"
        value={joinToken}
        onChange={(e) => setJoinToken(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleJoinPlaylist()}
        placeholder="Paste invite token..."
        className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
      />
      <motion.button
        onClick={handleJoinPlaylist}
        disabled={joining || !joinToken.trim()}
        whileHover={{ scale: joining ? 1 : 1.02 }}
        whileTap={{ scale: joining ? 1 : 0.97 }}
        className="px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
      >
        {joining ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block"
            />
            Joining...
          </span>
        ) : 'Join'}
      </motion.button>
    </div>
  </div>
);

export default HomePage;