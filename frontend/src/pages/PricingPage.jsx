import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { setPageMeta } from "../utils/meta";

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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-red-200/65">Pricing</p>
          <h1 className="text-5xl font-black">Simple freemium pricing for collaborative learning</h1>
          <p className="text-white/65 text-lg">Start free, invite up to 5 collaborators per playlist room, and upgrade when you need bigger study groups.</p>
          {upgradePrompt ? <p className="text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">{upgradePrompt}</p> : null}
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <article className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-white/40 mb-4">Free</p>
            <h2 className="text-4xl font-black">$0</h2>
            <ul className="mt-6 space-y-3 text-white/75">
              <li>Import YouTube playlists</li>
              <li>Track progress and streaks</li>
              <li>Live text, image, and voice chat</li>
              <li>Invite up to 5 collaborators per room</li>
            </ul>
          </article>

          <article className="rounded-[32px] border border-red-500/25 bg-gradient-to-br from-red-500/10 to-orange-500/10 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-red-200 mb-4">Premium</p>
            <h2 className="text-4xl font-black">Coming soon</h2>
            <ul className="mt-6 space-y-3 text-white/80">
              <li>Unlimited collaborators per room</li>
              <li>Priority product support</li>
              <li>Premium growth tools for communities</li>
              <li>Upgrade-ready billing flow placeholder</li>
            </ul>
            <Link to="/login?redirect=/courses" className="inline-flex mt-8 px-5 py-3 rounded-2xl bg-white text-black font-semibold">
              Join waitlist flow
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
};

export default PricingPage;

