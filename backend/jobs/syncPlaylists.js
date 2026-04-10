import cron from "node-cron";
import Playlist from "../models/Playlist.js";
import { shouldSync, getSyncCategory, syncPlaylistVideos } from "../utils/syncUtils.js";
import { syncQueue } from "../queues/syncQueue.js";


cron.schedule("0 */6 * * *", async () => {
  console.log("\n🔄 Sync job started:", new Date().toLocaleString());

  try {
    const playlists = await Playlist.find({}).select("title playlistId youtubePlaylistId lastSyncedAt lastAccessedAt videos lastVideoPublishedAt")

    console.log(`📋 Total playlists: ${playlists.length}`);

    let hot = 0,
      warm = 0,
      cold = 0,
      skipped = 0;

    for (const playlist of playlists) {
      const category = getSyncCategory(playlist);

      if (shouldSync(playlist)) {
        await syncQueue.add(
          "sync-playlist",
          { playlistId: playlist._id.toString() },
          {
            jobId: playlist._id.toString(), // ✅ duplicate jobs prevent karta hai
          }
        );

        if (category.includes("HOT")) hot++;
        else if (category.includes("WARM")) warm++;
        else cold++;

        await new Promise((r) => setTimeout(r, 300)); // rate limit
      } else {
        skipped++;
      }
    }

    console.log(`
📊 Summary:
🔥 Hot: ${hot}
🌤️ Warm: ${warm}
❄️ Cold: ${cold}
⏭️ Skipped: ${skipped}
    `);
  } catch (err) {
    console.error("❌ Sync job error:", err.message);
  }
});

console.log("⏰ Sync job registered (runs every 6 hours)");