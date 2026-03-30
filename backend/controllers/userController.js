import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { buildAvatarUrl, generateUniqueUsername, serializeUser } from "../utils/userIdentity.js";

dotenv.config();

const GOOGLE_MAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|googlemail\.com)$/i;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

export const registerUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const requestedUsername = req.body.username?.trim();

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
      avatar: buildAvatarUrl(username),
    });

    return res.status(201).json({
      ...serializeUser(user),
      token: generateToken(user._id),
    });
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

    if (username?.trim()) {
      user.username = await generateUniqueUsername({ username: username.trim() }, user._id);
    }

    if (avatar?.trim()) {
      user.avatar = avatar.trim();
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

