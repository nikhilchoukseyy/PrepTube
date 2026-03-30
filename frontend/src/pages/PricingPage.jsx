import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { setPageMeta } from "../utils/meta";
import { IC } from "./Icons";

const FREE_FEATURES = [
  { icon: IC.Play, text: "Import unlimited YouTube playlists" },
  { icon: IC.BarChart, text: "Track progress and build streaks" },
  { icon: IC.MessageSquare, text: "Live text, image & voice chat" },
  { icon: IC.Users, text: "Invite up to 5 collaborators per room" },
];

const PRO_FEATURES = [
  { icon: IC.Users, text: "Unlimited collaborators per room" },
  { icon: IC.Zap, text: "Priority product support" },
  { icon: IC.Globe, text: "Premium growth tools for communities" },
  { icon: IC.Crown, text: "Upgrade-ready billing flow" },
];

const PricingPage = () => {
  const location = useLocation();
  const upgradePrompt = location.state?.upgradePrompt;

  useEffect(() => {
    setPageMeta({
      title: "PrepTube Pricing",
      description: "See what comes with PrepTube Free and what unlocks with PrepTube Premium.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">

        {/* Header */}
        <section className="text-center max-w-2xl mx-auto space-y-4 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 font-medium mb-2">
            <IC.Star className="w-3.5 h-3.5 text-amber-400" />
            Simple freemium
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">Pricing that grows with you</h1>
          <p className="text-white/55 text-base sm:text-lg font-medium">
            Start free with up to 5 collaborators. Upgrade when your study group needs more.
          </p>
          {upgradePrompt && (
            <div className="flex items-start gap-2.5 text-left text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 text-sm font-medium">
              <IC.Zap className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              {upgradePrompt}
            </div>
          )}
        </section>

        {/* Cards */}
        <section className="grid sm:grid-cols-2 gap-5">
          {/* Free */}
          <article className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35 font-medium mb-1">Free forever</p>
                <h2 className="text-4xl sm:text-5xl font-black">$0</h2>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <IC.BookOpen className="w-5 h-5 text-white/50" />
              </div>
            </div>

            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-white/70 font-medium">
                  <span className="mt-0.5 w-5 h-5 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <IC.Check className="w-3 h-3 text-emerald-400" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <Link
              to="/courses"
              className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
            >
              <IC.Play className="w-4 h-4" /> Get started free
            </Link>
          </article>

          {/* Premium */}
          <article className="rounded-[28px] sm:rounded-[32px] border border-red-500/25 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/5 p-6 sm:p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300/70 font-medium px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                Coming soon
              </span>
            </div>

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-red-300/70 font-medium mb-1">Premium</p>
                <h2 className="text-4xl sm:text-5xl font-black">TBA</h2>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <IC.Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-white/80 font-medium">
                  <span className="mt-0.5 w-5 h-5 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3 text-red-300" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <Link
              to="/login?redirect=/courses"
              className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-colors shadow-lg"
            >
              <IC.Zap className="w-4 h-4 text-orange-500" /> Join waitlist
            </Link>
          </article>
        </section>

        {/* FAQ row */}
        <section className="rounded-[24px] border border-white/8 bg-white/[0.02] p-6 sm:p-8 grid sm:grid-cols-3 gap-5 text-center">
          {[
            { icon: IC.CheckCircle, title: "Cancel anytime", desc: "No commitments, ever." },
            { icon: IC.Users, title: "Team-friendly", desc: "One owner, unlimited guests on Premium." },
            { icon: IC.Globe, title: "Public rooms", desc: "Free rooms can be public and listed on Explore." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                <Icon className="w-4 h-4 text-white/40" />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-white/45 text-xs font-medium">{desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default PricingPage;