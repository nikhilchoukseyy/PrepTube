import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
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
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Name</label>
              <p className="text-xl">{user.name}</p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Email</label>
              <p className="text-xl">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;