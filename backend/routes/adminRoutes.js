import express from "express";
import { getAdminAnalytics } from "../controllers/adminController.js";
import { createReview, deleteReview, getAdminReviews } from "../controllers/reviewController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/analytics", protect, adminOnly, getAdminAnalytics);
router.get("/reviews", protect, adminOnly, getAdminReviews);
router.post("/reviews", protect, adminOnly, createReview);
router.delete("/reviews/:id", protect, adminOnly, deleteReview);

export default router;
