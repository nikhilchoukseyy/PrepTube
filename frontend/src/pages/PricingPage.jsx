import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, getToken, requireAuthRedirect, updateStoredUser } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { LIMITED_TIME_PRO_PROMO } from "../utils/promo";
import { IC } from "./Icons";

const FREE_FEATURES = [
  { icon: IC.Play, text: "Import unlimited YouTube playlists" },
  { icon: IC.BarChart, text: "Track progress and build streaks" },
  { icon: IC.MessageSquare, text: "Live text, image and voice chat" },
  { icon: IC.Users, text: "Invite up to 5 collaborators per room" },
];

const PRO_FEATURES = [
  { icon: IC.Users, text: "Unlimited collaborators during your Pro early-access month" },
  { icon: IC.Zap, text: "Priority support for fast-moving study groups" },
  { icon: IC.Globe, text: "Keep larger rooms learning together without free-plan join limits" },
];

const PricingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const upgradePrompt = location.state?.upgradePrompt;
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageMeta({
      title: "PrepTube Pricing | Pro Early Access",
      description: "Claim PrepTube Pro free for a limited time and unlock your full study group setup.",
    });
  }, []);

  const onUnlockPro = async () => {
    posthog.capture("premium_free_claim_started", { promo: "limited-time-early-access" });

    if (!getToken()) {
      requireAuthRedirect(navigate, "/pricing");
      return;
    }

    try {
      setClaiming(true);
      setError("");
      const response = await axios.post(`${API_URL}/payment/claim-free-pro`, {}, { headers: authHeaders() });
      if (response.data?.user) {
        updateStoredUser(response.data.user);
      }
      posthog.capture("premium_free_claim_succeeded", { promo: "limited-time-early-access" });
      navigate("/courses");
    } catch (claimError) {
      setError(claimError.response?.data?.message || claimError.message || "Unable to unlock Pro right now.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <section className="max-w-4xl mx-auto space-y-5 px-2">
          <div className="relative overflow-hidden rounded-[28px] border border-red-400/20 bg-gradient-to-r from-[#140c0c] via-[#22120f] to-[#15100b] p-6 shadow-[0_24px_90px_rgba(249,115,22,0.14)] sm:p-8">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-amber-400/10 to-transparent blur-2xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" />
                  {LIMITED_TIME_PRO_PROMO.badge}
                </div>
                <h1 className="mt-4 text-3xl sm:text-5xl font-black leading-tight">
                  {LIMITED_TIME_PRO_PROMO.heading}
                </h1>
                <p className="mt-3 text-white/65 text-base sm:text-lg font-medium leading-relaxed">
                  {LIMITED_TIME_PRO_PROMO.subtext}
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/45 line-through">
                  {LIMITED_TIME_PRO_PROMO.previousPriceLabel}
                </span>
                <button
                  type="button"
                  onClick={onUnlockPro}
                  disabled={claiming}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 hover:brightness-110 disabled:opacity-70"
                >
                  {claiming ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                      Unlocking Pro...
                    </>
                  ) : (
                    <>
                      {LIMITED_TIME_PRO_PROMO.ctaLabel}
                      <IC.ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35 font-semibold">Simple pricing. Serious learning.</p>
            <p className="text-white/55 text-base sm:text-lg font-medium">
              Start free with up to 5 collaborators, then use this limited-time Pro offer to unlock the full PrepTube workspace for your study group.
            </p>
          </div>

          {upgradePrompt && (
            <div className="flex items-start gap-2.5 text-left text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 text-sm font-medium">
              <IC.Zap className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              {upgradePrompt}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2.5 text-left text-red-200 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm font-medium">
              <IC.X className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
              {error}
            </div>
          )}
        </section>

        <section className="grid sm:grid-cols-2 gap-5">
          <article className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35 font-medium mb-1">Free forever</p>
                <h2 className="text-4xl sm:text-5xl font-black">Rs 0</h2>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <IC.BookOpen className="w-5 h-5 text-white/50" />
              </div>
            </div>

            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map(({ text }) => (
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
              <IC.Play className="w-4 h-4" />
              Get started free
            </Link>
          </article>

          <article className="rounded-[28px] sm:rounded-[32px] border border-red-500/25 bg-gradient-to-br from-red-500/12 via-orange-500/8 to-amber-500/10 p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-[0_20px_80px_rgba(249,115,22,0.12)]">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-amber-100/90 font-medium px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                {LIMITED_TIME_PRO_PROMO.badge}
              </span>
            </div>

            <div className="flex items-center justify-between mb-5 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-red-300/70 font-medium mb-1">Pro plan</p>
                <div className="flex flex-wrap items-end gap-3">
                  <h2 className="text-4xl sm:text-5xl font-black text-amber-100">{LIMITED_TIME_PRO_PROMO.freePriceLabel}</h2>
                  <span className="text-sm text-white/35 font-semibold pb-2 line-through">{LIMITED_TIME_PRO_PROMO.previousPriceLabel}</span>
                </div>
                <p className="mt-2 text-sm text-white/70 font-medium">
                  Claim 30 days of Pro early access right now and unlock unlimited collaborators without paying during the promo window.
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                <IC.Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm font-semibold text-white">{LIMITED_TIME_PRO_PROMO.heading}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">{LIMITED_TIME_PRO_PROMO.subtext}</p>
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

            <button
              type="button"
              onClick={onUnlockPro}
              disabled={claiming}
              className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {claiming ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Unlocking Pro...
                </>
              ) : (
                <>
                  <IC.Zap className="w-4 h-4 text-orange-500" />
                  {LIMITED_TIME_PRO_PROMO.ctaLabel}
                </>
              )}
            </button>
          </article>
        </section>

        <section className="rounded-[24px] border border-white/8 bg-white/[0.02] p-6 sm:p-8 grid sm:grid-cols-3 gap-5 text-center">
          {[
            { icon: IC.Zap, title: "No payment today", desc: "Claim Pro early access instantly during this promo window with a single click." },
            { icon: IC.Users, title: "Made for groups", desc: "Bring in your full study circle without running into the free-plan collaborator cap." },
            { icon: IC.Globe, title: "30 days unlocked", desc: "Your free claim activates a full month of Pro access from the moment you unlock it." },
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
