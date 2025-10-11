import mongoose from "mongoose";
import dotenv from 'dotenv'
import Playlist from "./models/Playlist.js";

dotenv.config()

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const samplePlaylist = await Playlist.create({
      title: "Test Playlist",
      owner: "68e93e20805cf5f5f7a1e851",
      members: ["68e93e20805cf5f5f7a1e851"],
      videos: [
        { videoId: "abc123", title: "Video 1", duration: 300 },
        { videoId: "def456", title: "Video 2", duration: 600 }
      ],
      progress: [
        { user: "68e93e20805cf5f5f7a1e851", completedVideos: [] }
      ]
    });
  } catch (error) {
    console.log(`error: ${error}`)
  } finally {
    mongoose.disconnect();
  }

}

test(); 