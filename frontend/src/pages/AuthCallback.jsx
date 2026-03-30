import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setStoredAuth } from "../utils/auth";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const redirect = params.get("redirect") || "/courses";

    if (token) {
      setStoredAuth(token, {
        id: params.get("id"),
        name: params.get("name"),
        email: params.get("email"),
        username: params.get("username"),
        avatar: params.get("avatar"),
        plan: params.get("plan") || "free",
      });
      window.location.href = redirect;
      return;
    }

    navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/50">
      Signing you in...
    </div>
  );
};

export default AuthCallback;

