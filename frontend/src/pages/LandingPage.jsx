import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "motion/react";
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
import FeedbackPanel from "../components/FeedbackPanel";

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

const LandingPage = () => {
  const user = getStoredUser();

  const heroCtaLink = useMemo(
    () => (user ? "/courses" : "/login?redirect=/courses"),
    [user]
  );
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const scrollingReviews = useMemo(
    () => (reviews.length > 1 ? [...reviews, ...reviews] : reviews),
    [reviews]
  );

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

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      try {
        const response = await axios.get(`${API_URL}/reviews`);
        if (active) {
          setReviews(Array.isArray(response.data?.reviews) ? response.data.reviews : []);
        }
      } catch {
        if (active) {
          setReviews([]);
        }
      }
    };

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

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

        <section className="overflow-hidden px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="mx-auto mb-8 max-w-6xl text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <Icon.MessageSquare />
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Real learner reviews</p>
            </div>
            <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Built for when &quot;I&apos;ll watch it later&quot; stops working.
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="relative">
              <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:hidden">
                {reviews.map((review, index) => (
                  <ReviewCard
                    key={`${review._id || review.reviewerName}-mobile-${index}`}
                    r={review}
                    className="snap-center"
                  />
                ))}
              </div>

              <div className="hidden sm:block">
                <div className={`flex gap-4 ${reviews.length > 1 ? "animate-scroll-left pause-on-hover w-max" : "justify-center"}`}>
                  {scrollingReviews.map((review, index) => (
                    <ReviewCard key={`${review._id || review.reviewerName}-${index}`} r={review} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-10 text-center">
              <p className="text-lg font-bold text-white">Fresh reviews will appear here.</p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                The landing page now shows reviews added by the admin team instead of placeholder testimonials.
              </p>
            </div>
          )}
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-red-300/70">
                <Icon.Mail />
                Feedback
              </div>
              <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                Help shape what PrepTube should feel like next.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
                Share friction points, missing features, rough edges, or ideas you want to see in the product. Every response goes straight to the team.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <motion.aside
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-200">
                    <Icon.MessageSquare />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">What feedback helps most</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">
                      Specific moments are the most useful: what you expected, what happened instead, and what would have made it better.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    "Confusing flows while importing, joining, or navigating playlists",
                    "Features you want in rooms, chat, streaks, or progress tracking",
                    "Visual issues on mobile or desktop that make the app harder to use",
                    "Any place where PrepTube feels slower, clunkier, or less clear than it should",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="mt-0.5 text-emerald-300">
                        <Icon.CheckCircle />
                      </div>
                      <p className="text-sm leading-relaxed text-white/60">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-3 text-sm text-red-100/80">
                  Need product answers instead of feedback? You can browse the new <Link to="/faqs" className="font-semibold text-white underline decoration-white/30 underline-offset-4">FAQs page</Link> from the navbar.
                </div>
              </motion.aside>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
              >
                <FeedbackPanel />
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
