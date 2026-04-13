import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Playlist from "../models/Playlist.js";
import ChatMessage from "../models/ChatMessage.js";
import dotenv from "dotenv";
import { uploadBase64Media } from "../utils/mediaUpload.js";
import { buildAvatarUrl, generateUniqueUsername, normalizeAvatarInput, resolveAvatarSource, serializeUser } from "../utils/userIdentity.js";
import { sendWelcomeEmail, sendPasswordResetEmail, sendOwnerFeedbackEmail, sendOwnerQuestionEmail } from "../utils/emailService.js";
import { trackEvent } from "../utils/analytics.js";
import crypto from "crypto";


dotenv.config();

const GOOGLE_MAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|googlemail\.com)$/i;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

export const uploadAvatarAsset = async (req, res) => {
  try {
    const avatarUrl = await uploadBase64Media(req.body?.fileData, {
      folder: "preptube/avatars",
      resourceType: "image",
    });

    return res.json({
      message: "Avatar uploaded successfully",
      url: avatarUrl,
    });
  } catch (error) {
    return res.status(error.status || 500).json(error.body || { message: error.message || "Unable to upload avatar" });
  }
};

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
      avatarSource: normalizedAvatar ? "custom" : "generated",
      lastLoginAt: new Date(),
    });

    // Welcome email bhejo (async — user ko wait nahi karana)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error("Welcome email failed:", err.message)
    );

    trackEvent(user._id, "user_signed_up", {
      method: "email",
      username: user.username,
    });

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

    const user = await User.findOne({ email }).select("email googleId password passwordResetToken passwordResetExpires");


    if (!user) {
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


    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired" });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const submitQuestion = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const question = req.body.question?.trim();

  try {
    if (!name || !email || !question) {
      return res.status(400).json({ message: "Name, email, and question are required" });
    }

    if (name.length > 80) {
      return res.status(400).json({ message: "Name must be 80 characters or fewer" });
    }

    if (question.length < 10) {
      return res.status(400).json({ message: "Question should be at least 10 characters long" });
    }

    if (question.length > 2000) {
      return res.status(400).json({ message: "Question must be 2000 characters or fewer" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    await sendOwnerQuestionEmail({ name, email, question });

    return res.status(200).json({
      message: "Your question has been sent. We will get back to you soon.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to send your question right now" });
  }
};

export const submitFeedback = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const feedback = req.body.feedback?.trim();

  try {
    if (!name || !email || !feedback) {
      return res.status(400).json({ message: "Name, email, and feedback are required" });
    }

    if (name.length > 80) {
      return res.status(400).json({ message: "Name must be 80 characters or fewer" });
    }

    if (feedback.length < 10) {
      return res.status(400).json({ message: "Feedback should be at least 10 characters long" });
    }

    if (feedback.length > 2000) {
      return res.status(400).json({ message: "Feedback must be 2000 characters or fewer" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    await sendOwnerFeedbackEmail({ name, email, feedback });

    return res.status(200).json({
      message: "Your feedback has been sent. Thank you for helping improve PrepTube.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to send your feedback right now" });
  }
};

export const loginUser = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select(
      "name email username avatar avatarSource password googleId isPremium plan premiumExpiresAt role lastLoginAt passwordResetToken"
    );

    if (user?.googleId && !user.password) {
      return res.status(400).json({ message: "This account uses Google sign-in. Please continue with Google." });
    }

    if (user && user.password && (await user.matchPassword(password))) {
      if (!user.username) {
        user.username = await generateUniqueUsername({ name: user.name, email: user.email }, user._id);
      }
      if (!user.avatar) {
        user.avatar = buildAvatarUrl(user.username || user.name || user.email);
        user.avatarSource = "generated";
      } else if (!user.avatarSource) {
        user.avatarSource = resolveAvatarSource(user);
      }
      user.lastLoginAt = new Date();
      await user.save();

      trackEvent(user._id, "user_logged_in", {
        method: "email",
      });

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
      user.avatarSource = normalizedAvatar ? "custom" : "generated";
    } else if (!user.avatar) {
      user.avatar = buildAvatarUrl(user.username || user.name || user.email);
      user.avatarSource = "generated";
    } else if (!user.avatarSource) {
      user.avatarSource = resolveAvatarSource(user);
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

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const ownedPlaylists = await Playlist.find({ owner: userId }).select("_id");
    const ownedPlaylistIds = ownedPlaylists.map((playlist) => playlist._id);

    if (ownedPlaylistIds.length > 0) {
      await Promise.all([
        ChatMessage.deleteMany({ playlist: { $in: ownedPlaylistIds } }),
        Playlist.deleteMany({ _id: { $in: ownedPlaylistIds } }),
      ]);
    }

    await Promise.all([
      Playlist.updateMany(
        { members: userId },
        { $pull: { members: userId } }
      ),
      Playlist.updateMany(
        { "progress.user": userId },
        { $pull: { progress: { user: userId } } }
      ),
      Playlist.updateMany(
        { "videoNotes.user": userId },
        { $pull: { videoNotes: { user: userId } } }
      ),
      ChatMessage.deleteMany({ sender: userId }),
      User.deleteOne({ _id: userId }),
    ]);

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete account" });
  }
};
