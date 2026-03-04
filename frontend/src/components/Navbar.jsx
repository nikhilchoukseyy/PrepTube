import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <nav className="bg-black min-w-full flex justify-between items-center text-white px-6 py-4 shadow-lg">
      <Link to="/" className="text-2xl font-bold hover:text-blue-400 transition">
        PrepTube
      </Link>

      <div className="flex items-center gap-6">
        {isLoggedIn ? (
          <>
            <Link 
              to="/" 
              className="hover:text-blue-400 transition"
            >
              My Playlists
            </Link>
            <Link 
              to="/profile" 
              className="hover:text-blue-400 transition"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;