import Review from "../models/Review.js";
import { uploadBase64Media } from "../utils/mediaUpload.js";
import { normalizeImageInput } from "../utils/userIdentity.js";

const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function expandShortHex(value = "") {
  if (!/^#[0-9a-f]{3}$/i.test(value)) return value;
  const [, r, g, b] = value;
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
}

function normalizeHexColor(value) {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmedValue)) {
    return null;
  }

  return expandShortHex(trimmedValue);
}

function serializeReview(review = {}) {
  return {
    _id: review?._id ? String(review._id) : "",
    reviewerName: review.reviewerName || "",
    field: review.field || "",
    review: review.review || "",
    reviewImage: review.reviewImage || "",
    backgroundColor: review.backgroundColor || "#1f2937",
    starRating: Number(review.starRating || 5),
    isPublished: review.isPublished !== false,
    createdAt: review.createdAt || null,
    updatedAt: review.updatedAt || null,
  };
}

export const uploadReviewImage = async (req, res) => {
  try {
    const reviewImageUrl = await uploadBase64Media(req.body?.fileData, {
      folder: "preptube/reviews",
      resourceType: "image",
    });

    return res.json({
      message: "Review image uploaded successfully",
      url: reviewImageUrl,
    });
  } catch (error) {
    console.error("uploadReviewImage error:", error.message);
    return res.status(error.status || 500).json(error.body || { message: "Unable to upload review image right now" });
  }
};

export const getPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();

    return res.json({
      reviews: reviews.map(serializeReview),
    });
  } catch (error) {
    console.error("getPublicReviews error:", error.message);
    return res.status(500).json({ message: "Unable to load reviews right now" });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      reviews: reviews.map(serializeReview),
    });
  } catch (error) {
    console.error("getAdminReviews error:", error.message);
    return res.status(500).json({ message: "Unable to load admin reviews right now" });
  }
};

export const createReview = async (req, res) => {
  const reviewerName = req.body.reviewerName?.trim();
  const field = req.body.field?.trim();
  const reviewText = req.body.review?.trim() || "";
  const starRating = Number(req.body.starRating);
  const normalizedImage = req.body.reviewImage !== undefined ? normalizeImageInput(req.body.reviewImage) : "";
  const normalizedBackgroundColor = normalizeHexColor(req.body.backgroundColor);

  try {
    if (!reviewerName || !field) {
      return res.status(400).json({ message: "Reviewer name and field are required" });
    }

    if (reviewerName.length > 80 || field.length > 80) {
      return res.status(400).json({ message: "Reviewer name and field must be 80 characters or fewer" });
    }

    if (reviewText.length > 1200) {
      return res.status(400).json({ message: "Review must be 1200 characters or fewer" });
    }

    if (!Number.isInteger(starRating) || starRating < 1 || starRating > 5) {
      return res.status(400).json({ message: "Star rating must be a whole number between 1 and 5" });
    }

    if (!normalizedImage) {
      return res.status(400).json({ message: "A review screenshot is required" });
    }

    if (req.body.reviewImage !== undefined && normalizedImage === null) {
      return res.status(400).json({ message: "Review screenshot must be a valid image upload or URL" });
    }

    if (!normalizedBackgroundColor) {
      return res.status(400).json({ message: "Background color must be a valid hex color" });
    }

    const review = await Review.create({
      reviewerName,
      field,
      review: reviewText,
      reviewImage: normalizedImage || "",
      backgroundColor: normalizedBackgroundColor,
      starRating,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      message: "Review created successfully",
      review: serializeReview(review),
    });
  } catch (error) {
    console.error("createReview error:", error.message);
    return res.status(500).json({ message: "Unable to create review right now" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id).lean();

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("deleteReview error:", error.message);
    return res.status(500).json({ message: "Unable to delete review right now" });
  }
};
