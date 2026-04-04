import mongoose from "mongoose";

const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const reviewSchema = new mongoose.Schema(
  {
    reviewerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    field: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    review: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1200,
    },
    reviewImage: {
      type: String,
      required: true,
      default: "",
      trim: true,
    },
    backgroundColor: {
      type: String,
      default: "#1f2937",
      trim: true,
      validate: {
        validator(value) {
          return HEX_COLOR_REGEX.test(value || "");
        },
        message: "Background color must be a valid hex value",
      },
    },
    starRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ isPublished: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
