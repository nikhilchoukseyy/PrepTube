import axios from "axios";
import Playlist from "../models/Playlist.js";
import dotenv from "dotenv";

dotenv.config();

export const createPlaylist = async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    const userId = req.user._id;

    const urlParams = new URLSearchParams(new URL(playlistUrl).search);
    const playlistId = urlParams.get("list");

    if (!playlistId) {
      return res.status(400).json({ message: "Invalid YouTube playlist URL" });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    const baseUrl = "https://www.googleapis.com/youtube/v3/playlistItems";
    let videos = [];
    let nextPageToken = "";

    do {
      const response = await axios.get(baseUrl, {
        params: {
          part: "snippet",
          playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
          key: apiKey,
        },
      });

      const items = response.data.items.map((item) => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        thumbnail: item.snippet.thumbnails?.default?.url,
      }));

      videos.push(...items);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    const videoIds = videos.map((v) => v.videoId);
    const durationUrl = "https://www.googleapis.com/youtube/v3/videos";
    let videoDurations = {}

    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const durationRes = await axios.get(durationUrl, {
        params: {
          part: "contentDetails",
          id: chunk.join(","),
          key: apiKey,
        },
      })

      durationRes.data.items.forEach((item) => {
        const duration = item.contentDetails.duration;
        const seconds = isoDurationToSeconds(duration);
        videoDurations[item.id] = { duration, durationSeconds: seconds };
      });
    }

    videos = videos.map((v) => ({
      ...v,
      duration: videoDurations[v.videoId]?.duration || "Unknown",
      durationSeconds: videoDurations[v.videoId]?.durationSeconds || 0,
    }));

    const newPlaylist = new Playlist({
      playlistId,
      title: videos[0]?.title || "Untitled Playlist",
      videos,
      owner: userId,
    });

    await newPlaylist.save();

    res.status(201).json({
      message: "Playlist created successfully!",
      totalVideos: videos.length,
      playlist: newPlaylist,
    });
  } catch (error) {
    console.error("Error creating playlist:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

function isoDurationToSeconds(isoDuration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, hours, minutes, seconds] = isoDuration.match(regex) || [];
  return (
    (parseInt(hours || 0) * 3600) +
    (parseInt(minutes || 0) * 60) +
    parseInt(seconds || 0)
  );
}

export const getUserPlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const playlists = await Playlist.find({ owner: userId })
    res.status(200).json({ playlists })
  } catch (error) {
    console.error("Error fetching playlists:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

export const markVideoCompleted = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;
    const userId = req.user._id;

    const playlist = await Playlist.findOne({ playlistId });
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    let userProgress = playlist.progress.find(p => p.user.equals(userId));

    if (!userProgress) {
      userProgress = { user: userId, completedVideos: [] };
      playlist.progress.push(userProgress);
    }

    if (!userProgress.completedVideos.includes(videoId)) {
      userProgress.completedVideos.push(videoId);
    }

    await playlist.save();

    res.status(200).json({ message: "Video marked as completed", playlist });
  } catch (error) {
    console.error("Error marking video completed", error.message);
    res.status(500).json({ message: "Server error" });
  }
}

function computePlaylistStats(playlist) {
  const videos = playlist.videos || [];
  const totalSeconds = videos.reduce((s, v) => s + (v.durationSeconds || 0), 0);

  const durMap = {};
  videos.forEach(v => { durMap[v.videoId] = v.durationSeconds || 0; });

  const userStats = (playlist.progress || []).map(p => {
    const completed = p.completedVideos || [];
    const watchedSeconds = completed.reduce((acc, vid) => acc + (durMap[vid] || 0), 0);
    const totalVideos = videos.length;
    const percent = totalVideos ? Math.round((completed.length / totalVideos) * 100) : 0;
    return {
      user: p.user,
      completedCount: completed.length,
      percent,
      watchedSeconds,
      watchedHours: +(watchedSeconds / 3600).toFixed(2),
      completedVideos: completed
    };
  });

  return { totalSeconds, totalHours: +(totalSeconds / 3600).toFixed(2), userStats };
}

export const getPlaylistDetail = async (req, res) => {
  try {
    const playlistId = req.params.id;
    const playlist = await Playlist.findOne({ playlistId }).populate('owner members progress.user', 'name email');

    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    const { totalSeconds, totalHours, userStats } = computePlaylistStats(playlist);

    const userId = req.user._id.toString();
    const requesterProgress = playlist.progress.find(p => p.user && p.user._id ? p.user._id.toString() === userId : p.user.toString() === userId);
    const completedSet = new Set(requesterProgress?.completedVideos || []);

    const videos = playlist.videos.map(v => ({
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.duration,
      durationSeconds: v.durationSeconds,
      completed: completedSet.has(v.videoId)
    }));

    res.status(200).json({
      playlist: {
        playlistId: playlist.playlistId,
        title: playlist.title,
        owner: playlist.owner,
        members: playlist.members,
        videos,
        totals: { totalSeconds, totalHours },
        userStats
      }
    });
  } catch (error) {
    console.error("getPlaylistDetail error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export const unmarkVideoCompleted = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;
    const userId = req.user._id;

    const playlist = await Playlist.findOne({ playlistId });
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    const progIndex = playlist.progress.findIndex(p => p.user.equals(userId));
    if (progIndex === -1) return res.status(400).json({ message: "No progress record found for user" });

    const pv = playlist.progress[progIndex];
    pv.completedVideos = pv.completedVideos.filter(v => v !== videoId);

    await playlist.save();
    res.status(200).json({ message: "Video unmarked", playlist });
  } catch (err) {
    console.error("unmarkVideoCompleted error", err);
    res.status(500).json({ message: "Server error" });
  }
};
