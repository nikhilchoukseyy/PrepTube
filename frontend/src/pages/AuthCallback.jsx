import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setStoredAuth } from "../utils/auth";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const redirect = params.get("redirect") || "/courses";

    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) throw new Error("No user returned");
        setStoredAuth(token, data.user);
        window.location.href = redirect;
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/50">
      Signing you in...
    </div>
  );
};

export default AuthCallback;