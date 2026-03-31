import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { setPageMeta } from "../utils/meta";
import { getLastPayment } from "../utils/payment";
import { IC } from "./Icons";

function formatMoney(amount = 0, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

const SuccessPage = () => {
  const location = useLocation();
  const payment = useMemo(() => location.state?.payment || getLastPayment(), [location.state]);

  useEffect(() => {
    setPageMeta({
      title: "Payment Successful | PrepTube",
      description: "Your PrepTube Pro purchase was completed successfully.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <section className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-[#111111] to-[#080808] p-6 sm:p-10 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.16),transparent_34%)]" />
          <div className="relative space-y-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
              <IC.CheckCircle className="w-7 h-7 text-emerald-300" />
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70 font-semibold">Payment complete</p>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight">PrepTube Pro is ready.</h1>
              <p className="text-white/65 text-sm sm:text-base max-w-2xl font-medium">
                Your checkout completed successfully and the payment signature was verified on the backend.
              </p>
            </div>

            {payment ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Plan", value: payment.planName || "PrepTube Premium Monthly" },
                  { label: "Amount", value: formatMoney(payment.amount, payment.currency) },
                  { label: "Status", value: payment.status || "paid" },
                  { label: "Access Until", value: payment.premiumExpiresAt ? new Date(payment.premiumExpiresAt).toLocaleString("en-IN") : "Monthly plan activated" },
                  { label: "Order ID", value: payment.orderId },
                  { label: "Payment ID", value: payment.paymentId || "Captured in Razorpay" },
                  { label: "Verified At", value: payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString("en-IN") : "Just now" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/35 font-semibold">{item.label}</p>
                    <p className="mt-2 text-sm text-white/85 break-all font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 font-medium">
                We could not find the latest payment details in session storage, but the checkout flow has completed.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
              >
                <IC.BookOpen className="w-4 h-4" />
                Go to courses
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/75 hover:bg-white/[0.06] transition-colors"
              >
                <IC.ArrowRight className="w-4 h-4" />
                Back to pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuccessPage;
