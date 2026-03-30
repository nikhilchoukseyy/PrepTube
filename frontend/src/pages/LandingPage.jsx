import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Navbar from "../components/Navbar";
import { getStoredUser } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { useEffect } from "react";

// ── Inline SVG icon set (no extra dep needed) ──────────────────────────────
const Icon = {
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  ),
  MessageSquare: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C8 6 6 10 8 14c-2-1-3-3-3-5C3 14 5 20 12 22c7-2 9-8 7-13-1 2-3 3-5 3 2-3 0-7-2-10z" />
    </svg>
  ),
  Import: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
      <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
      <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Compass: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
    </svg>
  ),
  Dot: () => (
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
  ),
};

const features = [
  {
    icon: <Icon.Import />,
    tag: "Import",
    title: "Paste URL. Done.",
    description:
      "Any YouTube playlist becomes a structured study room in seconds — thumbnails, durations, and order preserved automatically.",
    accent: "from-red-500/20 to-orange-500/10",
    iconBg: "bg-red-500/15 text-red-300",
  },
  {
    icon: <Icon.BarChart />,
    tag: "Progress",
    title: "See every step forward.",
    description:
      "Individual and team progress tracked live. Streaks reward consistency and keep the momentum alive across sessions.",
    accent: "from-emerald-500/20 to-teal-500/10",
    iconBg: "bg-emerald-500/15 text-emerald-300",
  },
  {
    icon: <Icon.MessageSquare />,
    tag: "Collab",
    title: "Chat beside the lesson.",
    description:
      "Discuss concepts and drop notes right next to the video — no tab switching, no context lost, no momentum broken.",
    accent: "from-amber-500/20 to-yellow-500/10",
    iconBg: "bg-amber-500/15 text-amber-300",
  },
];

const stats = [
  { icon: <Icon.Play />, label: "Videos", value: "42", color: "text-white" },
  { icon: <Icon.BarChart />, label: "Progress", value: "68%", color: "text-emerald-300" },
  { icon: <Icon.Flame />, label: "Streak", value: "5d", color: "text-amber-300" },
];

const LandingPage = () => {
  const user = getStoredUser();

  useEffect(() => {
    setPageMeta({
      title: "PrepTube | Study YouTube Playlists Together",
      description:
        "Turn YouTube playlists into collaborative study rooms with progress tracking, live chat, streaks, and shared learning.",
      ogTitle: "PrepTube | Study YouTube Playlists Together",
      ogDescription:
        "Import playlists, track progress, study with friends, and chat live inside a focused learning workspace.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <main>
        <section className="relative px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-28">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
            <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-orange-500/8 rounded-full blur-[90px]" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-center">

            {/* Left: copy */}
            <div className="w-full text-center lg:text-left">
            
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05]"
              >
                Study YouTube playlists
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-300 to-amber-200 mt-1">
                  together, not alone.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg text-white/60 mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                PrepTube turns any playlist into a shared learning room — progress tracking, live chat, streaks, and member invites all in one tab.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mt-8"
              >
                <Link
                  to={user ? "/courses" : "/login?redirect=/courses"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform text-sm sm:text-base"
                >
                  {user ? (
                    <><Icon.Play /> Open My Courses</>
                  ) : (
                    <><Icon.Zap /> Start Learning</>
                  )}
                </Link>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 font-semibold text-white/75 hover:bg-white/10 active:bg-white/15 transition-colors text-sm sm:text-base"
                >
                  <Icon.Compass /> Explore Courses
                </Link>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-center lg:justify-start gap-5 mt-8 text-xs text-white/35"
              >
                <span className="flex items-center gap-1.5"><Icon.CheckCircle /><span>Free to start</span></span>
                <span className="flex items-center gap-1.5"><Icon.Users /><span>Team rooms</span></span>
                <span className="flex items-center gap-1.5"><Icon.Flame /><span>Streak rewards</span></span>
              </motion.div>
            </div>

            {/* Right: 16:9 video card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              {/* Outer wrapper enforces 16:9 */}
              <div className="relative w-full rounded-[24px] sm:rounded-[32px] overflow-hidden border border-white/10 bg-black/60 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                style={{ aspectRatio: "16/9" }}
              >
                {/*
                  ── DROP YOUR VIDEO HERE ──────────────────────────────────────
                  Replace the placeholder div below with:
                    <video src="/your-demo.mp4" autoPlay muted loop playsInline
                      className="w-full h-full object-cover" />
                  OR for YouTube embed:
                    <iframe src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1"
                      className="w-full h-full" frameBorder="0" allowFullScreen />
                */}
                <div className="w-full h-full bg-gradient-to-br from-red-900/30 via-zinc-900 to-amber-900/20 flex flex-col items-center justify-center gap-3 select-none">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/80 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Icon.Play />
                  </div>
                  <p className="text-white/30 text-xs tracking-widest uppercase">Product demo video</p>
                </div>

                {/* Top overlay: workspace label + live dot */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-5 pt-3 sm:pt-4">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white/40 font-medium">
                    Collaborative Workspace
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Bottom overlay: course info + stats */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 sm:px-5 pb-4 sm:pb-5 pt-10">
                  <p className="text-white/45 text-[10px] sm:text-xs mb-0.5">Playlist</p>
                  <h2 className="text-sm sm:text-base md:text-lg font-bold leading-tight mb-3">
                    System Design Interview Course
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {stats.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2"
                      >
                        <span className={`${s.color} opacity-80`}>{s.icon}</span>
                        <div>
                          <p className={`text-sm sm:text-base font-black leading-none ${s.color}`}>{s.value}</p>
                          <p className="text-[9px] sm:text-[10px] text-white/40 leading-none mt-0.5">{s.label}</p>
                        </div>
                      </div>
                    ))}

                    {/* Extra tags */}
                    <div className="ml-auto hidden sm:flex flex-col gap-1 text-right">
                      <span className="text-[9px] text-white/35 flex items-center justify-end gap-1">
                        <Icon.Users /><span>Keep the playlist, add accountability.</span>
                      </span>
                      <span className="text-[9px] text-white/35 flex items-center justify-end gap-1">
                        <Icon.Zap /><span>Freemium rooms with upgrade-ready flows.</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={`rounded-[24px] sm:rounded-[28px] border border-white/8 bg-gradient-to-br ${f.accent} p-5 sm:p-6 group hover:border-white/15 transition-colors`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${f.iconBg}`}>
                    {f.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/30 font-medium pt-1">
                    {f.tag}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-2 leading-tight">{f.title}</h2>
                <p className="text-white/55 text-sm leading-relaxed">{f.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-white/30 group-hover:text-white/50 transition-colors">
                  <span>Learn more</span><Icon.ArrowRight />
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── SOCIAL PROOF ──────────────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-6xl mx-auto rounded-[24px] sm:rounded-[32px] border border-white/8 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 sm:p-8 md:p-10 flex flex-col lg:grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon.MessageSquare />
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">What people say</p>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
                Built for when "I'll watch it later" stops working.
              </h2>
            </div>
            <div className="w-full grid sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-white/65">
              <div className="rounded-2xl bg-black/30 border border-white/8 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon.Users />
                  <p className="text-white font-semibold text-xs">Learner</p>
                </div>
                <p className="leading-relaxed">"We finally finished a long course because everybody could see the progress."</p>
              </div>
              <div className="rounded-2xl bg-black/30 border border-white/8 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon.Zap />
                  <p className="text-white font-semibold text-xs">Team</p>
                </div>
                <p className="leading-relaxed">"PrepTube feels like a lightweight course room instead of a lonely playlist tab."</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;