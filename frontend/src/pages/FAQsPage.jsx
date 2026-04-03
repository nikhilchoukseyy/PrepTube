import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { faqs } from "../data/faqs";
import { setPageMeta } from "../utils/meta";
import { IC } from "./Icons";

const FAQsPage = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    setPageMeta({
      title: "PrepTube FAQs",
      description: "Read the most common questions about PrepTube rooms, progress, public playlists, streaks, and premium access.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <main className="px-4 pb-24 pt-14 sm:px-6 sm:pb-28 sm:pt-18">
        <section className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
              <IC.BookOpen className="h-3.5 w-3.5" />
              FAQs
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Answers for how PrepTube works in real study sessions.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
              Everything here matches the product as it works today, from importing playlists and tracking streaks to public rooms and premium limits.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <article
                    key={faq.question}
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
                        className={`shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        <IC.ChevronRight className="h-4 w-4 rotate-90" />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-white/8 px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                        <p className="pt-4 text-sm leading-relaxed text-white/60">{faq.answer}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <aside className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#131313] via-[#17120f] to-[#0d0d0d] p-5 sm:p-6 h-fit">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-200">
                <IC.MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-bold">Still missing an answer?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Share product feedback or ask something specific from the landing page form and it will reach the PrepTube owner directly.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/#feedback"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
                >
                  <IC.Send className="h-4 w-4" />
                  Go to feedback
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/75 transition-colors hover:bg-white/[0.07]"
                >
                  <IC.Zap className="h-4 w-4" />
                  See pricing
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQsPage;
