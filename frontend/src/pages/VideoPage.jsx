import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'

const VideoPage = () => {
  const [playlist, setPlaylist] = useState(null)
  const { id } = useParams();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/playlists/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlaylist(res.data);
      } catch (error) {
        console.log(error.response.data.message);
      }
    };
    fetchPlaylist();
  }, [id, token]);

  const toggleComplete = async (videoId) => {
    try {
      await axios.get(`http://localhost:8000/api/playlists/mark/${id}`, { videoId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlaylist({ ...playlist });
    } catch (error) {
      console.log(error.response.data.message);
    }
  }

  if (!playlist) return <div>Loading...</div>;

  return (
    <div>
      <h2>{playlist.title}</h2>
      <h4>Progress: {playlist.completedVideos?.length || 0}/{playlist.videos.length}</h4>
      {playlist.videos.map(v => (
        <div key={v._id}>
          {v.title} - {v.completed ? "✅" : "❌"}
          <button onClick={() => toggleComplete(v._id)}>Toggle Complete</button>
        </div>
      ))}
      <button onClick={() => alert("Generate Invite Token API call here")}>Generate Invite</button>
      <input placeholder="Join Token" />
      <button onClick={() => alert("Join Playlist API call here")}>Join Playlist</button>
      <div>
        <h4>Chat (Test)</h4>
        <input placeholder="Type message" />
        <button>Send</button>
        <div>{/* Messages will display here */}</div>
      </div>
    </div>
  );

}

export default VideoPage
