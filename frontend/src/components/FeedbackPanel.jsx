import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, getStoredUser } from "../utils/auth";
import { IC } from "../pages/Icons";

const FeedbackPanel = () => {
  const user = getStoredUser();
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState({ type: "", message: "" });
  const [feedbackForm, setFeedbackForm] = useState({
    name: user?.name || user?.username || "",
    email: user?.email || "",
    feedback: "",
  });

  useEffect(() => {
    setFeedbackForm((current) => ({
      ...current,
      name: current.name || user?.name || user?.username || "",
      email: current.email || user?.email || "",
    }));
  }, [user?.email, user?.name, user?.username]);

  const handleFeedbackChange = (field) => (event) => {
    setFeedbackStatus({ type: "", message: "" });
    setFeedbackForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    setSendingFeedback(true);
    setFeedbackStatus({ type: "", message: "" });

    try {
      const response = await axios.post(`${API_URL}/auth/feedback`, {
        name: feedbackForm.name,
        email: feedbackForm.email,
        feedback: feedbackForm.feedback,
      });

      setFeedbackStatus({
        type: "success",
        message: response.data?.message || "Your feedback has been sent successfully.",
      });
      setFeedbackForm((current) => ({
        ...current,
        feedback: "",
      }));
    } catch (error) {
      setFeedbackStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to send your feedback right now.",
      });
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <section id="feedback" className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#111111] via-[#16120f] to-[#0f0f0f] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.4)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-red-300">
          <IC.Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Share feedback</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/50">
            Tell us what feels useful, confusing, missing, or worth improving in PrepTube.
          </p>
        </div>
      </div>

      <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
            Name
          </label>
          <input
            type="text"
            value={feedbackForm.name}
            onChange={handleFeedbackChange("name")}
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
            value={feedbackForm.email}
            onChange={handleFeedbackChange("email")}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/35"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
            Feedback
          </label>
          <textarea
            value={feedbackForm.feedback}
            onChange={handleFeedbackChange("feedback")}
            placeholder="What should we improve, simplify, or build next?"
            maxLength={2000}
            rows={6}
            className="w-full resize-none rounded-[24px] border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/35"
          />
          <div className="mt-2 text-right text-[11px] font-medium text-white/25">
            {feedbackForm.feedback.length}/2000
          </div>
        </div>

        {feedbackStatus.message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              feedbackStatus.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/20 bg-red-500/10 text-red-200"
            }`}
          >
            {feedbackStatus.message}
          </div>
        )}

        <button
          type="submit"
          disabled={
            sendingFeedback ||
            !feedbackForm.name.trim() ||
            !feedbackForm.email.trim() ||
            !feedbackForm.feedback.trim()
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendingFeedback ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Sending feedback...
            </>
          ) : (
            <>
              <IC.Send className="h-4 w-4" />
              Send feedback
            </>
          )}
        </button>
      </form>
    </section>
  );
};

export default FeedbackPanel;
