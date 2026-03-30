import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/authMiddleware.js";
import { serializeUser } from "../utils/userIdentity.js";

const router = express.Router();

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
    const user = serializeUser(req.user);

    const search = new URLSearchParams({
      token,
      id: String(user.id),
      name: user.name || "",
      email: user.email || "",
      username: user.username || "",
      avatar: user.avatar || "",
      plan: user.plan || "free",
      redirect: stateRedirect,
    });

    res.redirect(`${frontendBase}/auth/callback?${search.toString()}`);
  }
);

router.get("/protected", protect, (req, res) => {
  res.json({ message: "Access granted", user: serializeUser(req.user) });
});

export default router;

