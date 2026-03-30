import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Navbar from "../components/Navbar";
import { getStoredUser } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { useEffect } from "react";

const features = [
  {
    title: "Import YouTube playlists instantly",
    description: "Paste a playlist URL and PrepTube turns it into a collaborative study room with durations, thumbnails, and progress tracking.",
  },
  {
    title: "Track progress together",
    description: "See what you have finished, how far your team has gone, and build streaks by actually spending time inside the workspace.",
  },
  {
    title: "Chat without leaving the lesson",
    description: "Discuss concepts, share screenshots, and drop quick voice notes right beside the videos you are studying.",
  },
];

const LandingPage = () => {
  const user = getStoredUser();

  useEffect(() => {
    setPageMeta({
      title: "PrepTube | Study YouTube Playlists Together",
      description: "Turn YouTube playlists into collaborative study rooms with progress tracking, live chat, streaks, and shared learning.",
      ogTitle: "PrepTube | Study YouTube Playlists Together",
      ogDescription: "Import playlists, track progress, study with friends, and chat live inside a focused learning workspace.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Navbar />
      <main>
        <section className="relative px-6 pt-18 pb-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.14),transparent_30%)]" />
          <div className="max-w-6xl  mx-auto relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-5xl md:text-7xl font-black tracking-tight leading-[1] max-w-4xl">
                Study YouTube playlists
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-300 to-amber-200">together, not alone.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-white/70 mt-6 max-w-2xl leading-relaxed">
                PrepTube turns any educational playlist into a shared learning room with progress tracking, live chat, member invites, and streaks that reward consistency.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-4 mt-8">
                <Link to={user ? "/courses" : "/login?redirect=/courses"} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-semibold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-transform">
                  {user ? "Open My Courses" : "Start Learning"}
                </Link>
                <Link to="/explore" className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 font-semibold text-white/80 hover:bg-white/10 transition-colors">
                  Explore Public Courses
                </Link>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="rounded-[32px]  border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
              <div className="rounded-[24px] border border-white/10 bg-[#080808] p-5 space-y-4">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-red-700/30 via-zinc-900 to-amber-500/10 border border-white/10 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/35">
                    <span>Collaborative Workspace</span>
                    <span>Live</span>
                  </div>
                  <div>
                    <p className="text-white/45 text-sm">Playlist</p>
                    <h2 className="text-2xl font-bold max-w-sm">System Design Interview Course</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-2xl font-black">42</p>
                      <p className="text-xs text-white/40">videos</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-2xl font-black text-emerald-300">68%</p>
                      <p className="text-xs text-white/40">progress</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-2xl font-black text-amber-200">5d</p>
                      <p className="text-xs text-white/40">streak</p>
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-sm text-white/45 mb-2">Why learners use it</p>
                    <p className="text-lg font-semibold">Keep the playlist, add accountability.</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-sm text-white/45 mb-2">Built for launch</p>
                    <p className="text-lg font-semibold">Freemium rooms with upgrade-ready flows.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.article key={feature.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.08 }} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-red-200/60 mb-4">Feature {index + 1}</p>
                <h2 className="text-2xl font-bold mb-3">{feature.title}</h2>
                <p className="text-white/65 leading-relaxed">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 md:p-10 grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Social proof placeholder</p>
              <h2 className="text-3xl md:text-4xl font-black">Built for the moment when “I’ll watch it later” stops working.</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-white/70">
              <div className="rounded-2xl bg-black/25 border border-white/10 p-5">
                <p className="text-white font-semibold mb-2">Learner quote</p>
                <p>“We finally finished a long course because everybody could see the progress and jump into chat instantly.”</p>
              </div>
              <div className="rounded-2xl bg-black/25 border border-white/10 p-5">
                <p className="text-white font-semibold mb-2">Team quote</p>
                <p>“PrepTube feels like a lightweight course room instead of a lonely playlist tab.”</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;

