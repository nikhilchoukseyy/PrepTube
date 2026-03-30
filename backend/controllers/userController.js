import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { buildAvatarUrl, generateUniqueUsername, normalizeAvatarInput, serializeUser } from "../utils/userIdentity.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../utils/emailService.js";
import crypto from "crypto";


dotenv.config();

const GOOGLE_MAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|googlemail\.com)$/i;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

export const registerUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const requestedUsername = req.body.username?.trim();
  const normalizedAvatar = normalizeAvatarInput(req.body.avatar);

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!GOOGLE_MAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: "Only Gmail accounts are allowed here. Use Continue with Google to verify your Google account.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (req.body.avatar !== undefined && normalizedAvatar === null) {
      return res.status(400).json({ message: "Avatar must be a valid image upload or URL" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const username = await generateUniqueUsername({ username: requestedUsername, name, email });
    const user = await User.create({
      name,
      email,
      password,
      username,
      avatar: normalizedAvatar || buildAvatarUrl(username),
    });

    // Welcome email bhejo (async — user ko wait nahi karana)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error("Welcome email failed:", err.message)
    );

    return res.status(201).json({
      ...serializeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });


    if (!user || (user.googleId && !user.password)) {
      return res.json({ message: "If this email exists, a reset link has been sent." });
    }


    const resetToken = crypto.randomBytes(32).toString("hex");


    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
      console.log("✅ Reset email sent to:", user.email);
    } catch (emailErr) {
      console.error("❌ Email send failed:", emailErr.message);
      console.error("Full error:", emailErr);
    }

    return res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // URL se aaya token hash karo, DB se match karo
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // Token abhi valid hai?
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired" });
    }

    // Password update karo, token clear karo
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (user?.googleId && !user.password) {
      return res.status(400).json({ message: "This account uses Google sign-in. Please continue with Google." });
    }

    if (user && user.password && (await user.matchPassword(password))) {
      if (!user.username) {
        user.username = await generateUniqueUsername({ name: user.name, email: user.email }, user._id);
      }
      if (!user.avatar) {
        user.avatar = buildAvatarUrl(user.username || user.name || user.email);
      }
      await user.save();

      return res.json({
        ...serializeUser(user),
        token: generateToken(user._id),
      });
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.json({ user: serializeUser(req.user) });
};

export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const user = req.user;
    const normalizedAvatar = avatar !== undefined ? normalizeAvatarInput(avatar) : user.avatar;

    if (username?.trim()) {
      user.username = await generateUniqueUsername({ username: username.trim() }, user._id);
    }

    if (avatar !== undefined && normalizedAvatar === null) {
      return res.status(400).json({ message: "Avatar must be a valid image upload or URL" });
    }

    if (avatar !== undefined) {
      user.avatar = normalizedAvatar || buildAvatarUrl(user.username || user.name || user.email);
    } else if (!user.avatar) {
      user.avatar = buildAvatarUrl(user.username || user.name || user.email);
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
