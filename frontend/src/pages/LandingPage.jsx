import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_URL, getStoredUser } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { LIMITED_TIME_PRO_PROMO } from "../utils/promo";
import { Volume2, VolumeX } from "lucide-react";
import demoImg from "../assets/demo_img.png";
import pasteUrlImg from "../assets/paste_url.png";
import chatImg from "../assets/chatImg.png";
import progressImg from "../assets/progress.png";
import ReviewCard from "../components/ReviewCard";

const demoVideoModules = import.meta.glob("../assets/*.{mp4,webm,ogg,mov,m4v}", {
  eager: true,
  import: "default",
});

const sortedDemoVideoEntries = Object.entries(demoVideoModules).sort(([leftPath], [rightPath]) =>
  leftPath.localeCompare(rightPath)
);

const demoVideoSrc =
  sortedDemoVideoEntries.find(([path]) => /demo|product|landing/i.test(path))?.[1] ||
  sortedDemoVideoEntries[0]?.[1] ||
  "";

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
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M4 6h16v12H4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  HelpCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M22 2 11 13" strokeLinecap="round" />
      <path d="M22 2 15 22l-4-9-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const features = [
  {
    icon: <Icon.Import />,
    tag: "Import",
    title: "Paste URL. Done.",
    description:
      "Any YouTube playlist becomes a structured study room in seconds with video order, thumbnails, and durations preserved automatically.",
    accent: "from-red-500/20 to-orange-500/10",
    iconBg: "bg-red-500/15 text-red-300",
    bgImage: pasteUrlImg
  },
  {
    icon: <Icon.BarChart />,
    tag: "Progress",
    title: "See every step forward.",
    description:
      "Track completed videos, study time, and streaks so solo progress and shared accountability stay visible in one place.",
    accent: "from-emerald-500/20 to-teal-500/10",
    iconBg: "bg-emerald-500/15 text-emerald-300",
    bgImage: progressImg
  },
  {
    icon: <Icon.MessageSquare />,
    tag: "Collab",
    title: "Chat beside the lesson.",
    description:
      "Discuss concepts, send voice or image messages, and keep private notes per video without losing the context of what you are studying.",
    accent: "from-amber-500/20 to-yellow-500/10",
    iconBg: "bg-amber-500/15 text-amber-300",
    bgImage: chatImg
  },
];

const reviews = [
  { username: "Arjun S.", role: "CS Student", review: "We finally finished a 120-video DSA course. The leaderboard made everyone competitive in the best way.", gradient: "from-red-500/20 to-orange-500/10" },
  { username: "Priya M.", role: "Study Group Lead", review: "PrepTube feels like a lightweight course room instead of a lonely playlist tab. Game changer.", gradient: "from-violet-500/20 to-purple-500/10" },
  { username: "Rahul K.", role: "Self Learner", review: "The streak feature is addictive. I haven't missed a study day in 3 weeks.", gradient: "from-emerald-500/20 to-teal-500/10" },
  { username: "Sneha R.", role: "Engineering Student", review: "Voice messages in the chat while watching? That's actually genius for quick doubt solving.", gradient: "from-amber-500/20 to-yellow-500/10" },
  { username: "Dev P.", role: "Bootcamp Student", review: "My friends kept saying they watched the videos. PrepTube showed the truth 😂", gradient: "from-pink-500/20 to-rose-500/10" },
  { username: "Ananya T.", role: "GATE Aspirant", review: "Imported 3 playlists in under a minute. The UI is clean and nothing feels bloated.", gradient: "from-cyan-500/20 to-sky-500/10" },
  { username: "Vikram N.", role: "Placement Prep", review: "Having a study room with real-time chat next to the video is exactly what was missing.", gradient: "from-lime-500/20 to-green-500/10" },
  { username: "Meera J.", role: "Online Learner", review: "Finally stopped losing my place in long playlists. Progress tracking is so satisfying.", gradient: "from-orange-500/20 to-red-500/10" },
  { username: "Karan B.", role: "College Group", review: "We use it for our entire semester prep. Sharing invite links is super smooth.", gradient: "from-indigo-500/20 to-blue-500/10" },
  { username: "Tanvi S.", role: "Competitive Coder", review: "The leaderboard hits different when you're ranked #1 in your study group 👑", gradient: "from-fuchsia-500/20 to-pink-500/10" },
  { username: "Rohan D.", role: "YouTube Learner", review: "I used to have 40 tabs open. Now I have PrepTube open. That's it.", gradient: "from-teal-500/20 to-emerald-500/10" },
  { username: "Ishaan V.", role: "DSA Grinder", review: "The accountability is real. Can't slack when your friends can see your 0% completion.", gradient: "from-yellow-500/20 to-amber-500/10" },
];

const faqs = [
  {
    question: "What exactly is PrepTube?",
    answer:
      "PrepTube turns a YouTube playlist into a collaborative study room. Instead of sharing links in chat and learning in separate tabs, members can join the same room, track progress, discuss lessons live, and stay accountable together.",
  },
  {
    question: "How do I import a playlist?",
    answer:
      "On the Courses page, paste any valid YouTube playlist URL. PrepTube extracts the YouTube playlist id, pulls the playlist metadata and video list from the YouTube Data API, calculates durations, and creates a room around that playlist.",
  },
  {
    question: "Can I use PrepTube for free?",
    answer:
      "Yes. The free plan lets you import playlists, track progress and streaks, use live chat, and invite up to 5 collaborators to a room, which means 6 total people including the owner.",
  },
  {
    question: "Are my notes visible to other members?",
    answer:
      "No. Video notes are private per user. Other room members can see the shared playlist, progress-related stats, and chat, but they cannot read your private notes for a video.",
  },
  {
    question: "How are streaks calculated?",
    answer:
      "Streaks are tracked per user and per playlist. PrepTube logs active study time from the workspace, and a day counts toward the streak once you reach at least 30 minutes on that playlist for that date in the Asia/Kolkata timezone.",
  },
  {
    question: "How do public playlists and Explore work?",
    answer:
      "The room owner can mark a playlist as public after selecting at least one topic. Public rooms appear in Explore and can be filtered by topic. Users still join the room before entering the full workspace.",
  },
  {
    question: "What if I do not renew my premium after 1 month?",
    answer:
      "Your account falls back to the free plan when the premium period ends. Existing room members keep their access, but new joins will follow the free plan member limit until you renew premium again.",
  },
  {
    question: "Do chat messages stay saved?",
    answer:
      "Yes. Text, image, and voice messages are stored so recent room chat can be loaded again when members reopen the workspace. Media uploads depend on Cloudinary being configured on the backend.",
  },
];

const LandingPage = () => {
  const user = getStoredUser();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [questionStatus, setQuestionStatus] = useState({ type: "", message: "" });
  const [questionForm, setQuestionForm] = useState({
    name: user?.name || user?.username || "",
    email: user?.email || "",
    question: "",
  });

  const heroCtaLink = useMemo(
    () => (user ? "/courses" : "/login?redirect=/courses"),
    [user]
  );
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

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

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !demoVideoSrc) return undefined;

    const handlePageShow = () => {
      const playPromise = videoElement.play();
      if (typeof playPromise?.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    handlePageShow();
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleQuestionChange = (field) => (event) => {
    setQuestionStatus({ type: "", message: "" });
    setQuestionForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    setSendingQuestion(true);
    setQuestionStatus({ type: "", message: "" });

    try {
      const response = await axios.post(`${API_URL}/auth/question`, {
        name: questionForm.name,
        email: questionForm.email,
        question: questionForm.question,
      });

      setQuestionStatus({
        type: "success",
        message: response.data?.message || "Your question has been sent successfully.",
      });
      setQuestionForm((current) => ({
        ...current,
        question: "",
      }));
    } catch (error) {
      setQuestionStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to send your question right now.",
      });
    } finally {
      setSendingQuestion(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
      <Navbar />

      <main>
        <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]" />
            <div className="absolute right-0 top-20 h-[300px] w-[300px] rounded-full bg-orange-500/8 blur-[90px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.02 }}
            >
              <Link
                to="/pricing"
                className="group relative block overflow-hidden rounded-[28px] border border-red-400/20 bg-gradient-to-r from-[#140c0c] via-[#22120f] to-[#15100b] p-5 shadow-[0_24px_90px_rgba(249,115,22,0.14)] sm:p-6"
              >
                <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-amber-400/10 to-transparent blur-2xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" />
                      {LIMITED_TIME_PRO_PROMO.badge}
                    </div>
                    <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl lg:text-[2.15rem]">
                      {LIMITED_TIME_PRO_PROMO.heading}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
                      {LIMITED_TIME_PRO_PROMO.subtext}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
                      {LIMITED_TIME_PRO_PROMO.previousPriceLabel}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-transform group-hover:scale-[1.02]">
                      {LIMITED_TIME_PRO_PROMO.ctaLabel}
                      <Icon.ArrowRight />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            <div className="flex flex-col items-center gap-10 lg:grid lg:grid-cols-[1fr_1fr] lg:gap-14">
              <div className="w-full text-center lg:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl"
                >
                  Study YouTube playlists
                  <span className="mt-1 block bg-gradient-to-r from-red-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                    together, not alone.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg lg:mx-0"
                >
                  PrepTube turns any playlist into a shared learning room with progress tracking, live chat, streaks, private notes, and room invites all in one tab.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:items-start lg:justify-start"
                >
                  <Link
                    to={heroCtaLink}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-red-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:text-base"
                  >
                    {user ? (
                      <>
                        <Icon.Play /> Open My Courses
                      </>
                    ) : (
                      <>
                        <Icon.Zap /> Start Learning
                      </>
                    )}
                  </Link>
                  <Link
                    to="/explore"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 active:bg-white/15 sm:w-auto sm:text-base"
                  >
                    <Icon.Compass /> Explore Courses
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mt-8 flex items-center justify-center gap-5 text-xs text-white/35 lg:justify-start"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon.CheckCircle />
                    <span>Free to start</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon.Users />
                    <span>Team rooms</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon.Flame />
                    <span>Streak rewards</span>
                  </span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full"
              >
                <div
                  className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/60 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:rounded-[32px]"
                  style={{ aspectRatio: "16/9" }}
                >
                  {demoVideoSrc ? (
                    <>
                      <video
                        ref={videoRef}
                        src={demoVideoSrc}
                        poster={demoImg}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        preload="auto"
                        className="h-full w-full object-cover"
                      />

                      {/* Mute/Unmute button */}
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm border border-white/10 hover:bg-black/80 transition"
                      >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        {isMuted ? "Unmute" : "Mute"}
                      </button>
                    </>
                  ) : (
                    <img
                      src={demoImg}
                      alt="Demo Preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 aspect-[16/9]"
              >
                {/* Image */}
                <img
                  src={feature.bgImage}
                  alt={feature.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

                {/* Content */}
                <div className="relative z-10 h-full flex items-end justify-center p-0.5">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg">

                    {/* Icon (smaller) */}
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${feature.iconBg}`}>
                      {feature.icon}
                    </div>

                    {/* Title (smaller) */}
                    <h2 className="text-xs sm:text-sm font-medium text-white">
                      {feature.title}
                    </h2>

                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-24 overflow-hidden">
  <div className="mx-auto max-w-6xl mb-8 text-center">
    <div className="mb-3 flex items-center justify-center gap-2">
      <Icon.MessageSquare />
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">What people say</p>
    </div>
    <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
      Built for when &quot;I&apos;ll watch it later&quot; stops working.
    </h2>
  </div>

  {/* Row 1 — left to right */}
  <div className="relative mb-4">
    <div className="flex gap-4 animate-scroll-left w-max">
      {[...reviews.slice(0, 6), ...reviews.slice(0, 6)].map((r, i) => (
        <ReviewCard key={i} r={r} />
      ))}
    </div>
  </div>

  {/* Row 2 — right to left */}
  <div className="relative">
    <div className="flex gap-4 animate-scroll-right w-max">
      {[...reviews.slice(6), ...reviews.slice(6)].map((r, i) => (
        <ReviewCard key={i} r={r} />
      ))}
    </div>
  </div>
</section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-red-300/70">
                <Icon.HelpCircle />
                FAQ
              </div>
              <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                Questions people ask before they start.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
                These answers match how PrepTube works right now, including rooms, topics, streaks, notes, and premium access.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                {faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <motion.article
                      key={faq.question}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ delay: index * 0.04 }}
                      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                      >
                        <span className="text-sm font-semibold leading-relaxed text-white sm:text-base">
                          {faq.question}
                        </span>
                        <span
                          className={`shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 transition-transform ${isOpen ? "rotate-180" : ""
                            }`}
                        >
                          <Icon.ChevronDown />
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-white/8 px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                          <p className="pt-4 text-sm leading-relaxed text-white/60">{faq.answer}</p>
                        </div>
                      )}
                    </motion.article>
                  );
                })}
              </div>

              <motion.aside
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 sm:p-6"
              >
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-red-300">
                    <Icon.Mail />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Still have a question?</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">
                      Send it directly from the landing page and it will go to the owner.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleQuestionSubmit} className="space-y-3.5">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                      Name
                    </label>
                    <input
                      type="text"
                      value={questionForm.name}
                      onChange={handleQuestionChange("name")}
                      placeholder="Your name"
                      maxLength={80}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/35"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                      Email
                    </label>
                    <input
                      type="email"
                      value={questionForm.email}
                      onChange={handleQuestionChange("email")}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/35"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                      Question
                    </label>
                    <textarea
                      value={questionForm.question}
                      onChange={handleQuestionChange("question")}
                      placeholder="Ask about rooms, premium, notes, streaks, chat, or anything else about PrepTube..."
                      maxLength={2000}
                      rows={6}
                      className="w-full resize-none rounded-[24px] border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/35"
                    />
                    <div className="mt-2 text-right text-[11px] font-medium text-white/25">
                      {questionForm.question.length}/2000
                    </div>
                  </div>

                  {questionStatus.message && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${questionStatus.type === "success"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        : "border-red-500/20 bg-red-500/10 text-red-200"
                        }`}
                    >
                      {questionStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      sendingQuestion ||
                      !questionForm.name.trim() ||
                      !questionForm.email.trim() ||
                      !questionForm.question.trim()
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingQuestion ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending question...
                      </>
                    ) : (
                      <>
                        <Icon.Send />
                        Send question
                      </>
                    )}
                  </button>
                </form>
              </motion.aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
