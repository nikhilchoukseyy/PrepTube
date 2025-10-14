import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import axios from 'axios'


const HomePage = () => {
  const [playlists, setPlaylists] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/playlists/my-playlists', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlaylists(res.data);
      } catch (err) {
        console.log(err.response?.data?.message || err.message);
      }
    };
    fetchPlaylists();
  }, [token])

  return (
    <div>
      <h2>My Playlists</h2>
      {playlists.map(p => (
        <div key={p._id}>
          <Link to={`/video/${p._id}`}>{p.title}</Link>
        </div>
      ))}
      <button onClick={() => alert("Add playlist API call here")}>Create Playlist (Test)</button>
    </div>
  )
}

export default HomePage