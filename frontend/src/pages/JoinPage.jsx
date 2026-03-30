import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";

const JoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Joining playlist...");
  const [error, setError] = useState("");

  useEffect(() => {
    setPageMeta({
      title: "Join Playlist | PrepTube",
      description: "Join a PrepTube playlist room from an invite link.",
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Invite token is missing.");
      setStatus("");
      return;
    }

    if (!getToken()) {
      requireAuthRedirect(navigate, `/join/${token}`);
      return;
    }

    const join = async () => {
      try {
        const res = await axios.post(`${API_URL}/playlists/join`, { token }, { headers: authHeaders() });
        navigate(`/video/${res.data.playlistId}`);
      } catch (err) {
        const payload = err.response?.data;
        if (payload?.error === "MEMBER_LIMIT_REACHED") {
          navigate("/pricing", { state: { upgradePrompt: payload.message } });
          return;
        }
        setError(payload?.message || "Unable to join this playlist.");
        setStatus("");
      }
    };

    join();
  }, [navigate, token]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        {error ? <p className="text-red-300">{error}</p> : <p className="text-white/70">{status}</p>}
      </main>
    </div>
  );
};

export default JoinPage;

