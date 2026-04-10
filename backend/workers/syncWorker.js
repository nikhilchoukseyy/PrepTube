import { Worker } from "bullmq";
import connection from "../config/redis.js";
import Playlist from "../models/Playlist.js";
import { syncPlaylistVideos } from "../utils/syncUtils.js";

const worker = new Worker(
  "sync-playlist",
  async (job) => {
    const { playlistId } = job.data;
    console.log(`🔄 Processing job ${job.id} for playlist: ${playlistId}`);

    
    const playlist = await Playlist.findById(playlistId);
    
    
    if (!playlist) throw new Error(`Playlist ${playlistId} not found`);

    
    await syncPlaylistVideos(playlist);
    console.log(`✅ Done: ${playlist.title}`);
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

export default worker;