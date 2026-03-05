import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token and user info from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    const id = params.get('id');

    if (token) {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify({ id, name, email }));
      window.location.href = '/';
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-white/40">Signing you in...</p>
    </div>
  );
};

export default AuthCallback;
