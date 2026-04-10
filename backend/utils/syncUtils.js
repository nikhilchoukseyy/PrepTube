import axios from 'axios'

export function shouldSync(playlist) {
  const now = Date.now();

  const lastAccessed = playlist.lastAccessedAt ? new Date(playlist.lastAccessedAt) : null;

  const lastSynced = playlist.lastSyncedAt ? new Date(playlist.lastSyncedAt) : null;

  if (!lastSynced) return true;

  const hourSinceSync = (now - lastSynced) / (1000 * 60 * 60);

  const daysSinceAccess = lastAccessed
    ? (now - lastAccessed) / (1000 * 60 * 60 * 24)
    : 999;

  if (daysSinceAccess < 7) {
    return hourSinceSync >= 24;
  }

  if (daysSinceAccess < 30) {
    return hourSinceSync >= 168;
  }

  return hourSinceSync >= 720;


}

export function getSyncCategory(playlist) {
  const lastAccessed = playlist.lastAccessedAt ? new Date(playlist.lastAccessedAt) : null;

  if (!lastAccessed) return "cold";

  const daysSinceAccess = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);

  if (daysSinceAccess < 7) return "HOT";
  if (daysSinceAccess < 30) return "WARM";
  return "COLD";
}

function isoToSeconds(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = parseInt(match?.[1] || 0);
  const m = parseInt(match?.[2] || 0);
  const s = parseInt(match?.[3] || 0);
  return h * 3600 + m * 60 + s;
}

export async function fetchVideosFromYoutube(youtubeId) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  let videos = [];
  let nextPageToken = null;

  do {
    const res = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
      params: {
        part: "snippet",
        playlistId: youtubeId,
        maxResults: 50,
        pageToken: nextPageToken,
        key: apiKey,
      },

    })
    const items = res.data.items;

    videos.push(
      ...items.map((item) => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url,
      }))
    );

    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  const durations = {};

  for (let i = 0; i < videos.length; i += 50) {
    const chunk = videos.slice(i, i + 50).map((v) => v.videoId);

    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "contentDetails",
          id: chunk.join(","),
          key: apiKey,
        },
      }
    );

    res.data.items.forEach((item) => {
      durations[item.id] = {
        duration: item.contentDetails.duration,
        durationSeconds: isoToSeconds(item.contentDetails.duration),
      };
    });
  }

  return videos.map((v) => ({
    ...v,
    duration: durations[v.videoId]?.duration || "NA",
    durationSeconds: durations[v.videoId]?.durationSeconds || 0,
  }));
}

import Playlist from "../models/Playlist.js";

export async function syncPlaylistVideos(playlist) {
  try {
    const youtubeId =
      playlist.youtubePlaylistId || playlist.playlistId;

    console.log(`YoutubeId : ${youtubeId}`);

    const lastPublished = playlist.lastVideoPublishedAt;

    let newVideos = [];
    let nextPageToken = null;
    const apiKey = process.env.YOUTUBE_API_KEY;

    let latestSeenDate = lastPublished;

    do {
      const res = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet",
            playlistId: youtubeId,
            maxResults: 50,
            pageToken: nextPageToken,
            key: apiKey,
          },
        }
      );

      const items = res.data.items;

      for (const item of items) {
        const videoId = item.snippet.resourceId.videoId;
        const publishedAt = new Date(item.snippet.publishedAt);

        // Skip old videos
        if (lastPublished && publishedAt <= lastPublished) {
          continue;
        }

        newVideos.push({
          title: item.snippet.title,
          videoId,
          thumbnail:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url,
          publishedAt,
        });

        // Track newest video
        if (!latestSeenDate || publishedAt > latestSeenDate) {
          latestSeenDate = publishedAt;
        }
      }

      nextPageToken = res.data.nextPageToken;

    } while (nextPageToken);

    // No new videos
    if (newVideos.length === 0) {
      await Playlist.updateOne(
        { _id: playlist._id },
        { $set: { lastSyncedAt: new Date() } }
      );
      return;
    }

    console.log(`🆕 New videos found: ${newVideos.length}`);

    const existingIds = new Set(
      (playlist.videos || []).map(v => v.videoId)
    );

    const seenIds = new Set((playlist.videos || []).map(v => v.videoId));

    const uniqueNewVideos = [];

    for (const v of newVideos) {
      if (!v.videoId || seenIds.has(v.videoId)) continue;
      seenIds.add(v.videoId);
      uniqueNewVideos.push(v);
    }
    const videoIds = uniqueNewVideos.map(v => v.videoId);
    const durationMap = {};

    if (videoIds.length > 0) {
      const res = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            part: "contentDetails",
            id: videoIds.join(","),
            key: apiKey,
          },
        }
      );

      res.data.items.forEach((item) => {
        durationMap[item.id] = {
          duration: item.contentDetails.duration,
          durationSeconds: isoToSeconds(item.contentDetails.duration),
        };
      });
    }
    const enrichedNewVideos = uniqueNewVideos.map((v) => ({
      ...v,
      duration: durationMap[v.videoId]?.duration || "NA",
      durationSeconds: durationMap[v.videoId]?.durationSeconds || 0,
    }));
    // Add new unique videos (latest first)
    const updatedVideos = [...enrichedNewVideos, ...(playlist.videos || [])];
    console.log("LATEST DATE:", latestSeenDate);
    await Playlist.updateOne(
      { _id: playlist._id },
      {
        $set: {
          videos: updatedVideos,
          lastSyncedAt: new Date(),
          lastVideoPublishedAt: latestSeenDate,

        },
      }
    );

    console.log(`✅ Incremental Sync (PRO): ${playlist.title}`);
  } catch (err) {
    console.error(`❌ Sync failed: ${playlist.title}`, err.message);
    throw err;
  }
}