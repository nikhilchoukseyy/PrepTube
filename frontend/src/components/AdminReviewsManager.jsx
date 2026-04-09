import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL, authHeaders } from "../utils/auth";
import { prepareImageUpload } from "../utils/avatarUpload";
import { DEFAULT_REVIEW_COLOR, REVIEW_COLOR_OPTIONS, normalizeReviewColor } from "../utils/reviews";
import { IC } from "../pages/Icons";
import AppImage from "./AppImage";
import ReviewCard from "./ReviewCard";

const INITIAL_FORM = {
  reviewerName: "",
  field: "",
  review: "",
  reviewImage: "",
  backgroundColor: DEFAULT_REVIEW_COLOR,
  starRating: 5,
};

function formatReviewDate(value) {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(parsedDate);
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/35";

const statusClassName = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/20 bg-red-500/10 text-red-200",
};

const AdminReviewsManager = () => {
  const [reviewForm, setReviewForm] = useState(INITIAL_FORM);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("success");

  const previewReview = useMemo(
    () => ({
      reviewerName: reviewForm.reviewerName || "Reviewer name",
      field: reviewForm.field || "Field or role",
      review: reviewForm.review,
      reviewImage: reviewForm.reviewImage,
      backgroundColor: reviewForm.backgroundColor,
      starRating: reviewForm.starRating,
    }),
    [reviewForm]
  );

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/reviews`, {
        headers: authHeaders(),
      });
      setReviews(Array.isArray(response.data?.reviews) ? response.data.reviews : []);
    } catch (error) {
      setStatusTone("error");
      setStatus(error.response?.data?.message || "Unable to load landing page reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const setFormField = (field, value) => {
    setReviewForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("");
    setUploadingImage(true);

    try {
      const preparedImage = await prepareImageUpload(file);
      setFormField("reviewImage", preparedImage);
    } catch (error) {
      setStatusTone("error");
      setStatus(error.message || "Unable to process the selected image.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    try {
      const response = await axios.post(`${API_URL}/admin/reviews`, reviewForm, {
        headers: authHeaders(),
      });

      setStatusTone("success");
      setStatus(response.data?.message || "Review created successfully.");
      setReviewForm({
        ...INITIAL_FORM,
        backgroundColor: reviewForm.backgroundColor,
        starRating: reviewForm.starRating,
      });
      await loadReviews();
    } catch (error) {
      setStatusTone("error");
      setStatus(error.response?.data?.message || "Unable to create review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm("Delete this review from the landing page?");
    if (!confirmed) return;

    setDeletingId(reviewId);
    setStatus("");

    try {
      const response = await axios.delete(`${API_URL}/admin/reviews/${reviewId}`, {
        headers: authHeaders(),
      });

      setStatusTone("success");
      setStatus(response.data?.message || "Review deleted successfully.");
      setReviews((current) => current.filter((review) => review._id !== reviewId));
    } catch (error) {
      setStatusTone("error");
      setStatus(error.response?.data?.message || "Unable to delete review.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-orange-200/70">
              Landing Reviews
            </p>
            <h2 className="text-2xl font-black sm:text-3xl">Publish real review cards from here.</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-white/55">
              Upload a real review screenshot, then add reviewer details, optional supporting text, a background color,
              and star rating. The screenshot becomes the main visual on the landing page.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white/60">
            <IC.MessageSquare className="h-4 w-4" />
            {loading ? "Loading reviews..." : `${reviews.length} live review${reviews.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleCreateReview} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/55">Reviewer name</label>
                <input
                  value={reviewForm.reviewerName}
                  onChange={(event) => setFormField("reviewerName", event.target.value)}
                  placeholder="Aarav Sharma"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/55">Field</label>
                <input
                  value={reviewForm.field}
                  onChange={(event) => setFormField("field", event.target.value)}
                  placeholder="Placement prep"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/55">Review description <span className="text-white/30">(optional)</span></label>
              <textarea
                value={reviewForm.review}
                onChange={(event) => setFormField("review", event.target.value)}
                placeholder="Optional short description below the screenshot."
                rows={4}
                className={`${inputClassName} min-h-32 resize-y`}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-white/55">Background color</label>
                  <input
                    type="color"
                    value={normalizeReviewColor(reviewForm.backgroundColor)}
                    onChange={(event) => setFormField("backgroundColor", event.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormField("backgroundColor", color.value)}
                      className={`group flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                        normalizeReviewColor(reviewForm.backgroundColor) === color.value
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white/80"
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color.value }} />
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/55">Star rating</label>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                  {Array.from({ length: 5 }, (_, index) => {
                    const value = index + 1;
                    const isActive = value <= reviewForm.starRating;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormField("starRating", value)}
                        className={`rounded-xl p-2 transition-colors ${isActive ? "bg-amber-400/15 text-amber-300" : "text-white/30 hover:text-white/70"}`}
                      >
                        <IC.Star className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {reviewForm.reviewImage ? (
                  <AppImage
                    src={reviewForm.reviewImage}
                    alt="Review preview"
                    width={80}
                    height={80}
                    loading="eager"
                    className="h-20 w-20 rounded-3xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] text-white/30">
                    <IC.User className="h-8 w-8" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Review screenshot</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">
                    Upload the actual review screenshot here. This is the main part of the card and is required before publishing.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/[0.05]">
                  <IC.Plus className="h-4 w-4" />
                  {uploadingImage ? "Processing..." : reviewForm.reviewImage ? "Change screenshot" : "Upload screenshot"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelection} />
                </label>
                <button
                  type="button"
                  onClick={() => setFormField("reviewImage", "")}
                  className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/55 hover:bg-white/[0.05]"
                >
                  Remove screenshot
                </button>
              </div>
            </div>

            {status ? (
              <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${statusClassName[statusTone]}`}>
                {statusTone === "success" ? <IC.CheckCircle className="h-4 w-4 shrink-0" /> : <IC.X className="h-4 w-4 shrink-0" />}
                {status}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving || uploadingImage || !reviewForm.reviewImage}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <IC.Check className="h-4 w-4" />}
              {saving ? "Publishing..." : "Publish review"}
            </button>

            {!reviewForm.reviewImage ? (
              <p className="text-xs font-medium text-white/35">
                Upload a screenshot to enable publishing.
              </p>
            ) : null}
          </form>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Live preview</p>
              <div className="mt-4 flex justify-center">
                <ReviewCard r={previewReview} />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 text-sm text-white/55">
              <p className="font-semibold text-white">What goes live</p>
              <p className="mt-2 leading-relaxed">
                Every card here is backed by the database now. Delete a review below and it disappears from the landing page.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {loading ? (
          <div className="xl:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm font-medium text-white/45">
            Loading published reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="xl:col-span-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm font-medium text-white/45">
            No landing page reviews yet. The first one you publish will appear here and on the homepage.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Published</p>
                  <p className="mt-1 text-sm font-medium text-white/55">{formatReviewDate(review.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteReview(review._id)}
                  disabled={deletingId === review._id}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deletingId === review._id ? (
                    <span className="h-4 w-4 rounded-full border-2 border-red-100/30 border-t-red-100 animate-spin" />
                  ) : (
                    <IC.Trash className="h-4 w-4" />
                  )}
                  {deletingId === review._id ? "Deleting..." : "Delete"}
                </button>
              </div>

              <ReviewCard r={review} className="w-full" />
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default AdminReviewsManager;
