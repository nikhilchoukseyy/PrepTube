import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import Navbar from "../components/Navbar";
import { getToken, requireAuthRedirect } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { handlePayment } from "../utils/payment";
import { IC } from "./Icons";

const FREE_FEATURES = [
  { icon: IC.Play, text: "Import unlimited YouTube playlists" },
  { icon: IC.BarChart, text: "Track progress and build streaks" },
  { icon: IC.MessageSquare, text: "Live text, image and voice chat" },
  { icon: IC.Users, text: "Invite up to 5 collaborators per room" },
];

const PRO_FEATURES = [
  { icon: IC.Users, text: "Unlimited collaborators while your premium plan is active" },
  { icon: IC.Zap, text: "Priority support for fast-moving study groups" },
  { icon: IC.Globe, text: "Keep larger rooms learning together without free-plan join limits" },
];

const PricingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const upgradePrompt = location.state?.upgradePrompt;
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageMeta({
      title: "PrepTube Pricing",
      description: "Compare PrepTube Free and Pro, then upgrade instantly with Razorpay checkout.",
    });
  }, []);

  const onBuyNow = async () => {
    posthog.capture("premium_checkout_started", { plan: "monthly" });

    if (!getToken()) {
      requireAuthRedirect(navigate, "/pricing");
      return;
    }

    try {
      setBuying(true);
      setError("");
      const result = await handlePayment();
      navigate("/success", { state: { payment: result.payment } });
    } catch (checkoutError) {
      setError(checkoutError.message || "Unable to complete the payment right now.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <section className="text-center max-w-3xl mx-auto space-y-4 px-2">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">Simple pricing. Serious learning.</h1>
          <p className="text-white/55 text-base sm:text-lg font-medium">
            Start free with up to 5 collaborators, then upgrade to PrepTube Premium when your study group needs more room to learn together.
          </p>
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
              <span className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80 font-medium px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                Most popular
              </span>
            </div>

            <div className="flex items-center justify-between mb-5 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-red-300/70 font-medium mb-1">Pro plan</p>
                <div className="flex items-end gap-2">
                  <h2 className="text-4xl sm:text-5xl font-black">Rs 99</h2>
                  <span className="text-sm text-white/45 font-semibold pb-2">per month</span>
                </div>
                <p className="mt-2 text-sm text-white/55 font-medium">
                  Stay premium for 30 days per payment and renew whenever you want to keep unlimited member access active.
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
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

            <button
              type="button"
              onClick={onBuyNow}
              disabled={buying}
              className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {buying ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Securing checkout...
                </>
              ) : (
                <>
                  <IC.Zap className="w-4 h-4 text-orange-500" />
                  Subscribe now
                </>
              )}
            </button>
          </article>
        </section>

        <section className="rounded-[24px] border border-white/8 bg-white/[0.02] p-6 sm:p-8 grid sm:grid-cols-3 gap-5 text-center">
          {[
            { icon: IC.Lock, title: "Secure checkout", desc: "Pay with confidence through a protected checkout experience designed for smooth, reliable upgrades." },
            { icon: IC.Users, title: "Made for groups", desc: "Bring in your full study circle with unlimited collaborators while your premium month is active." },
            { icon: IC.Globe, title: "Flexible access", desc: "If premium expires, your existing members stay in place and you can renew anytime to unlock unlimited new joins again." },
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
