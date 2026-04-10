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

const videoNoteSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "", trim: true },
    updatedAt: { type: Date, default: Date.now },
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
    earnedBadges: { type: [String], default: [] },
    dailyMinutes: [dailyMinutesSchema],
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    playlistId: { type: String, required: true, unique: true },
    youtubePlaylistId: { type: String },
    title: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPublic: { type: Boolean, default: false },
    topics: [{ type: String, trim: true, maxlength: 40 }],
    inviteToken: { type: String },
    videos: [videoSchema],
    videoNotes: [videoNoteSchema],
    progress: [progressSchema],
    lastSyncedAt: { type: Date , default:null},
    lastAccessedAt: { type: Date , default:Date.now},
    lastVideoPublishedAt:{type:Date,default:null},
  },
  { timestamps: true }
);

playlistSchema.pre("validate", function syncYoutubePlaylistId(next) {
  if (!this.youtubePlaylistId && this.playlistId) {
    // Legacy documents stored the YouTube playlist id directly in playlistId.
    this.youtubePlaylistId = this.playlistId;
  }

  next();
});

playlistSchema.path("videoNotes").validate(function validateUniqueVideoNotes(videoNotes = []) {
  const noteKeys = videoNotes
    .map((note) => {
      const videoId = note?.videoId ? String(note.videoId) : "";
      const userId = note?.user ? String(note.user) : "";
      return videoId && userId ? `${videoId}:${userId}` : "";
    })
    .filter(Boolean);
  return noteKeys.length === new Set(noteKeys).size;
}, "Each user can only have one private note per playlist video.");

const Playlist = mongoose.model("Playlist", playlistSchema);

playlistSchema.index({ owner: 1 })                    
playlistSchema.index({ youtubePlaylistId: 1 })        
playlistSchema.index({ isPublic: 1, createdAt: -1 })  
playlistSchema.index({ inviteToken: 1 })              
playlistSchema.index({ members: 1 })                 
playlistSchema.index({ 'progress.user': 1 }) 

export default Playlist;
