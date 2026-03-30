import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { buildAvatarUrl } from "../utils/userIdentity.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    avatar: { type: String },
    role: { type: String, default: "user" },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }],
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.avatar) {
    this.avatar = buildAvatarUrl(this.username || this.name || this.email);
  }

  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPass) {
  return bcrypt.compare(enteredPass, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

