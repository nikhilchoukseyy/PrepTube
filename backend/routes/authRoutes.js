import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import { serializeUser } from "../utils/userIdentity.js";
import { forgotPassword, resetPassword, submitQuestion } from "../controllers/userController.js";




const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

router.get("/google", (req, res, next) => {
  const redirectTo = req.query.redirect || "/courses";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: redirectTo,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    const stateRedirect = req.query.state || "/courses";
    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim();

    const search = new URLSearchParams({
      token,
      redirect: stateRedirect,
      isNewUser: String(req.user?._oauthIsNewUser === true),
    });

    res.redirect(`${frontendBase}/auth/callback?${search.toString()}`);
  }
);

router.get("/protected", protect, (req, res) => {
  res.json({ message: "Access granted", user: serializeUser(req.user) });
});

router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.post("/question", submitQuestion);

export default router;
