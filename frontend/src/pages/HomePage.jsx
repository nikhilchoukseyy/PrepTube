import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:8000/api';

const HomePage = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
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
      fetchPlaylists();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Playlists</h1>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Create Playlist Form */}
        <form onSubmit={handleCreatePlaylist} className="mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create New Playlist</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="Enter YouTube Playlist URL"
              className="flex-1 px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>

        {/* Playlists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-12">
              No playlists yet. Create one to get started!
            </div>
          ) : (
            playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/video/${playlist.playlistId}`}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition"
              >
                <h3 className="text-xl font-semibold mb-2">{playlist.title}</h3>
                <p className="text-gray-400 mb-4">
                  {playlist.videos?.length || 0} videos
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{playlist.members?.length || 1} members</span>
                  <span>→</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;