import mongoose from "mongoose";

const dailyMinutesSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    minutes: { type: Number, default: 0 },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true },
    title: { type: String, required: true },
    thumbnail: { type: String },
    duration: { type: String },
    durationSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    completedVideos: [{ type: String }],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStreakDate: { type: String },
    dailyMinutes: [dailyMinutesSchema],
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    playlistId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPublic: { type: Boolean, default: false },
    inviteToken: { type: String },
    videos: [videoSchema],
    progress: [progressSchema],
  },
  { timestamps: true }
);

const Playlist = mongoose.model("Playlist", playlistSchema);
export default Playlist;

