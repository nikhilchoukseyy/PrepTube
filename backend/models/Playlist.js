import mongoose from "mongoose";


const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail:{type:String},
  duration: { type: String} ,
  durationSeconds: { type: Number, default: 0 },
});


const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedVideos: [{ type: String }] 
});


const inviteTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const playlistSchema = new mongoose.Schema({
  playlistId : {type:String,required:true},
  title: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  videos: [videoSchema],
  progress: [progressSchema],
  inviteTokens: [inviteTokenSchema]
}, { timestamps: true }); 


const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
