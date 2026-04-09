import express from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, getCurrentUser, updateProfile, deleteAccount, uploadAvatarAsset } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/avatar-upload", authLimiter, uploadAvatarAsset);
router.get("/me", protect, getCurrentUser);
router.patch("/profile", protect, updateProfile);
router.delete("/me", protect, deleteAccount);

export default router;
