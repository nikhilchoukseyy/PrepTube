// ─── JoinPage.jsx ────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { IC } from "./Icons";

export const JoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("joining");
  const [error, setError] = useState("");

  useEffect(() => {
    setPageMeta({ title: "Join Playlist | PrepTube", description: "Join a PrepTube playlist room from an invite link." });
  }, []);

  useEffect(() => {
    if (!token) { setError("Invite token is missing."); setStatus("error"); return; }
    if (!getToken()) { requireAuthRedirect(navigate, `/join/${token}`); return; }

    const join = async () => {
      try {
        const res = await axios.post(`${API_URL}/playlists/join`, { token }, { headers: authHeaders() });
        navigate(`/video/${res.data.playlistId}`);
      } catch (err) {
        const payload = err.response?.data;
        if (payload?.error === "MEMBER_LIMIT_REACHED") { navigate("/pricing", { state: { upgradePrompt: payload.message } }); return; }
        setError(payload?.message || "Unable to join this playlist.");
        setStatus("error");
      }
    };

    join();
  }, [navigate, token]);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-md mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        {status === "joining" && !error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <IC.Link2 className="w-6 h-6 text-white/30 animate-pulse" />
            </div>
            <p className="text-white/50 font-medium">Joining playlist room...</p>
            <span className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <IC.X className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-300 font-medium">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinPage;