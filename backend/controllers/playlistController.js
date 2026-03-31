import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import ChatMessage from "../models/ChatMessage.js";
import Playlist from "../models/Playlist.js";
import User from "../models/User.js";
import { canAccessPlaylist, isPlaylistMember, isPlaylistOwner } from "../utils/playlistAccess.js";
import { buildAvailablePlaylistTopics, normalizePlaylistTopics } from "../utils/playlistTopics.js";
import { DEFAULT_TIMEZONE, getDateKeyInTimezone, serializeUser } from "../utils/userIdentity.js";
import { trackEvent } from "../utils/analytics.js";

dotenv.config();

const FRONTEND_BASE_URL = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim();

function extractInviteToken(rawValue) {
  if (!rawValue || typeof rawValue !== "string") return "";

  const trimmedValue = rawValue.trim();
  if (!trimmedValue) return "";

  try {
    const parsedUrl = new URL(trimmedValue);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const joinIndex = pathSegments.findIndex((segment) => segment === "join");

    if (joinIndex !== -1 && pathSegments[joinIndex + 1]) {
      return pathSegments[joinIndex + 1];
    }

    return parsedUrl.searchParams.get("token") || trimmedValue;
  } catch {
    return trimmedValue.split("/").filter(Boolean).pop() || trimmedValue;
  }
}

function isoDurationToSeconds(isoDuration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, hours, minutes, seconds] = isoDuration.match(regex) || [];
  return parseInt(hours || 0, 10) * 3600 + parseInt(minutes || 0, 10) * 60 + parseInt(seconds || 0, 10);
}

function ensureProgressEntry(playlist, userId) {
  let userProgress = playlist.progress.find((entry) => String(entry.user?._id || entry.user) === String(userId));

  if (!userProgress) {
    userProgress = {
      user: userId,
      completedVideos: [],
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      dailyMinutes: [],
    };
    playlist.progress.push(userProgress);
    userProgress = playlist.progress.find((entry) => String(entry.user?._id || entry.user) === String(userId));
  }

  return userProgress;
}

function getEntityId(value) {
  return String(value?._id || value?.id || value || "");
}

function hasUserProfileFields(user) {
  return Boolean(user && typeof user === "object" && (user.username || user.name || user.email || user.avatar));
}

function pickPreferredUser(currentUser, nextUser) {
  if (hasUserProfileFields(currentUser)) return currentUser;
  if (hasUserProfileFields(nextUser)) return nextUser;
  return currentUser || nextUser;
}

function mergeDailyMinutesEntries(entries = []) {
  const minutesByDate = new Map();

  for (const entry of entries) {
    if (!entry?.date) continue;
    const minutes = Number(entry.minutes || 0);
    minutesByDate.set(entry.date, +Number((minutesByDate.get(entry.date) || 0) + minutes).toFixed(2));
  }

  return Array.from(minutesByDate.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, minutes]) => ({ date, minutes }));
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function computeStreakStats(dailyMinutes = [], todayKey = getDateKeyInTimezone(new Date(), DEFAULT_TIMEZONE)) {
  const qualifyingDates = dailyMinutes
    .filter((entry) => Number(entry.minutes || 0) >= 30)
    .map((entry) => entry.date)
    .sort();

  if (qualifyingDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
    };
  }

  let longestStreak = 1;
  let runningLongest = 1;
  for (let index = 1; index < qualifyingDates.length; index += 1) {
    if (addDays(qualifyingDates[index - 1], 1) === qualifyingDates[index]) {
      runningLongest += 1;
    } else {
      runningLongest = 1;
    }
    longestStreak = Math.max(longestStreak, runningLongest);
  }

  let currentStreak = 0;
  if (qualifyingDates.includes(todayKey)) {
    currentStreak = 1;
    for (let index = qualifyingDates.length - 2; index >= 0; index -= 1) {
      const nextDate = qualifyingDates[index + 1 - (qualifyingDates.length - 1 - index - 1)];
      if (addDays(qualifyingDates[index], 1) === addDays(todayKey, -(qualifyingDates.length - 1 - index))) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    let cursor = todayKey;
    currentStreak = 1;
    while (qualifyingDates.includes(addDays(cursor, -1))) {
      cursor = addDays(cursor, -1);
      currentStreak += 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastStreakDate: qualifyingDates[qualifyingDates.length - 1],
  };
}

function formatMember(user) {
  if (!user) return null;
  const serialized = serializeUser(user);
  return {
    _id: String(serialized.id),
    id: String(serialized.id),
    name: serialized.name,
    email: serialized.email,
    username: serialized.username,
    avatar: serialized.avatar,
    plan: serialized.plan,
  };
}

function normalizeProgressEntries(progress = []) {
  const mergedByUserId = new Map();
  let changed = false;

  for (const entry of progress) {
    const userId = getEntityId(entry?.user);
    if (!userId) {
      changed = true;
      continue;
    }

    const existing = mergedByUserId.get(userId);
    const completedVideos = Array.from(
      new Set([...(existing?.completedVideos || []), ...((entry?.completedVideos || []).filter(Boolean))])
    );
    const dailyMinutes = mergeDailyMinutesEntries([...(existing?.dailyMinutes || []), ...(entry?.dailyMinutes || [])]);
    const streakStats = computeStreakStats(dailyMinutes, getDateKeyInTimezone(new Date(), DEFAULT_TIMEZONE));

    mergedByUserId.set(userId, {
      user: pickPreferredUser(existing?.user, entry.user),
      completedVideos,
      currentStreak: streakStats.currentStreak,
      longestStreak: streakStats.longestStreak,
      lastStreakDate: streakStats.lastStreakDate,
      dailyMinutes,
    });

    if (
      existing ||
      completedVideos.length !== (entry?.completedVideos || []).length ||
      dailyMinutes.length !== (entry?.dailyMinutes || []).length ||
      (entry?.currentStreak || 0) !== streakStats.currentStreak ||
      (entry?.longestStreak || 0) !== streakStats.longestStreak ||
      (entry?.lastStreakDate || null) !== streakStats.lastStreakDate
    ) {
      changed = true;
    }
  }

  const normalizedProgress = Array.from(mergedByUserId.values());
  if (normalizedProgress.length !== progress.length) changed = true;

  return { normalizedProgress, changed };
}

function normalizeVideoNotes(videoNotes = []) {
  const latestNoteByOwnerAndVideo = new Map();
  let changed = false;

  for (const note of videoNotes) {
    const videoId = String(note?.videoId || "").trim();
    const userId = getEntityId(note?.user || note?.updatedBy);
    if (!videoId || !userId) {
      changed = true;
      continue;
    }

    const content = typeof note?.content === "string" ? note.content.trim() : "";
    const updatedAt = note?.updatedAt ? new Date(note.updatedAt) : new Date(0);
    const ownerKey = `${videoId}:${userId}`;
    const existing = latestNoteByOwnerAndVideo.get(ownerKey);

    if (!existing || updatedAt >= existing.updatedAt) {
      latestNoteByOwnerAndVideo.set(ownerKey, {
        videoId,
        user: note?.user || note?.updatedBy,
        content,
        updatedAt,
      });
    }

    if (content !== (note?.content || "")) {
      changed = true;
    }
  }

  const normalizedVideoNotes = Array.from(latestNoteByOwnerAndVideo.values()).map((note) => ({
    ...note,
    updatedAt: note.updatedAt instanceof Date && !Number.isNaN(note.updatedAt.getTime()) ? note.updatedAt : new Date(0),
  }));

  if (normalizedVideoNotes.length !== videoNotes.length) changed = true;

  return { normalizedVideoNotes, changed };
}

function normalizePlaylistState(playlist) {
  const ownerId = getEntityId(playlist?.owner);
  const uniqueMembers = [];
  const seenMemberIds = new Set();
  let membersChanged = false;

  for (const member of playlist?.members || []) {
    const memberId = getEntityId(member);
    if (!memberId || memberId === ownerId || seenMemberIds.has(memberId)) {
      membersChanged = true;
      continue;
    }

    seenMemberIds.add(memberId);
    uniqueMembers.push(member);
  }

  const { normalizedProgress, changed: progressChanged } = normalizeProgressEntries(playlist?.progress || []);
  const { normalizedVideoNotes, changed: videoNotesChanged } = normalizeVideoNotes(playlist?.videoNotes || []);
  const normalizedTopics = normalizePlaylistTopics(playlist?.topics || []);
  const currentTopics = playlist?.topics || [];
  const topicsChanged =
    normalizedTopics.length !== currentTopics.length ||
    normalizedTopics.some((topic, index) => topic !== currentTopics[index]);

  if (membersChanged) {
    playlist.members = uniqueMembers;
  }

  if (progressChanged) {
    playlist.progress = normalizedProgress;
  }

  if (videoNotesChanged) {
    playlist.videoNotes = normalizedVideoNotes;
  }

  if (topicsChanged) {
    playlist.topics = normalizedTopics;
  }

  return membersChanged || progressChanged || videoNotesChanged || topicsChanged;
}

function getPlaylistParticipants(playlist) {
  const participants = [];
  const seenUserIds = new Set();

  for (const user of [playlist?.owner, ...(playlist?.members || [])]) {
    const userId = getEntityId(user);
    if (!userId || seenUserIds.has(userId)) continue;
    seenUserIds.add(userId);
    participants.push(user);
  }

  return participants;
}

function computePlaylistStats(playlist) {
  const videos = playlist.videos || [];
  const totalSeconds = videos.reduce((sum, video) => sum + (video.durationSeconds || 0), 0);
  const durationMap = Object.fromEntries(videos.map((video) => [video.videoId, video.durationSeconds || 0]));
  const { normalizedProgress } = normalizeProgressEntries(playlist.progress || []);
  const progressByUserId = new Map(normalizedProgress.map((entry) => [getEntityId(entry.user), entry]));

  const userStats = getPlaylistParticipants(playlist)
    .map((participant) => {
      const participantId = getEntityId(participant);
      const entry = progressByUserId.get(participantId);
      const completedVideos = entry?.completedVideos || [];
      const watchedSeconds = completedVideos.reduce((acc, videoId) => acc + (durationMap[videoId] || 0), 0);
      const completedCount = completedVideos.length;
      const totalVideos = videos.length;
      const percent = totalVideos ? Math.round((completedCount / totalVideos) * 100) : 0;
      const todayMinutes =
        (entry?.dailyMinutes || []).find((daily) => daily.date === getDateKeyInTimezone(new Date(), DEFAULT_TIMEZONE))?.minutes || 0;

      return {
        user: formatMember(participant),
        completedCount,
        percent,
        watchedSeconds,
        watchedHours: +(watchedSeconds / 3600).toFixed(2),
        completedVideos,
        currentStreak: entry?.currentStreak || 0,
        longestStreak: entry?.longestStreak || 0,
        todayMinutes: +Number(todayMinutes || 0).toFixed(2),
      };
    })
    .filter((stat) => stat.user)
    .sort((left, right) =>
      right.percent - left.percent ||
      right.completedCount - left.completedCount ||
      right.watchedSeconds - left.watchedSeconds ||
      right.currentStreak - left.currentStreak ||
      (left.user?.username || left.user?.name || "").localeCompare(right.user?.username || right.user?.name || "")
    );

  return {
    totalSeconds,
    totalHours: +(totalSeconds / 3600).toFixed(2),
    userStats,
  };
}

async function fetchPlaylistWithMembers(playlistId) {
  return Playlist.findOne({ playlistId }).populate("owner members progress.user videoNotes.user", "name email username avatar isPremium plan premiumExpiresAt");
}

async function assertPlaylistAccess(playlistId, userId) {
  const playlist = await fetchPlaylistWithMembers(playlistId);
  if (!playlist) {
    return { error: { status: 404, body: { message: "Playlist not found" } } };
  }

  if (!canAccessPlaylist(playlist, userId)) {
    return { error: { status: 403, body: { message: "You no longer have access to this playlist" } } };
  }

  normalizePlaylistState(playlist);

  return { playlist };
}

async function uploadToCloudinary(fileData, messageType) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Media storage is not configured");
    error.status = 503;
    error.body = { message: "Media uploads are not configured on the server yet" };
    throw error;
  }

  const resourceType = messageType === "image" ? "image" : "video";
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "preptube/chat";
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");
  const normalizedFileData = fileData.replace(
    /^(data:[a-zA-Z]+\/[a-zA-Z0-9]+)[^,]*(,)/,
    "$1;base64$2"
  );
  const form = new FormData();
  form.append("file", normalizedFileData);
  form.append("folder", folder);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Failed to upload media");
    error.status = response.status;
    error.body = { message: payload?.error?.message || "Failed to upload media" };
    throw error;
  }

  return payload.secure_url;
}

export const createPlaylist = async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    const userId = req.user._id;
    const urlParams = new URLSearchParams(new URL(playlistUrl).search);
    const playlistId = urlParams.get("list");

    if (!playlistId) {
      return res.status(400).json({ message: "Invalid YouTube playlist URL" });
    }

    const existingPlaylist = await Playlist.findOne({ playlistId });
    if (existingPlaylist) {
      if (String(existingPlaylist.owner) === String(userId) || existingPlaylist.members.some((member) => String(member) === String(userId))) {
        return res.status(200).json({
          message: "Playlist already exists in your library",
          playlist: existingPlaylist,
        });
      }

      return res.status(409).json({
        message: "This YouTube playlist has already been imported into PrepTube. Ask the owner for access or use Explore if it is public.",
      });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    const playlistMetaResponse = await axios.get("https://www.googleapis.com/youtube/v3/playlists", {
      params: {
        part: "snippet",
        id: playlistId,
        key: apiKey,
      },
    });

    const playlistTitle = playlistMetaResponse.data.items?.[0]?.snippet?.title;
    if (!playlistTitle) {
      return res.status(404).json({ message: "Playlist not found on YouTube" });
    }

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
        thumbnail:
          item.snippet.thumbnails?.maxres?.url ||
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url,
      }));

      videos.push(...items);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    const videoIds = videos.map((video) => video.videoId);
    const videoDurations = {};

    for (let index = 0; index < videoIds.length; index += 50) {
      const chunk = videoIds.slice(index, index + 50);
      const durationResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "contentDetails",
          id: chunk.join(","),
          key: apiKey,
        },
      });

      durationResponse.data.items.forEach((item) => {
        const duration = item.contentDetails.duration;
        videoDurations[item.id] = {
          duration,
          durationSeconds: isoDurationToSeconds(duration),
        };
      });
    }

    videos = videos.map((video) => ({
      ...video,
      duration: videoDurations[video.videoId]?.duration || "Unknown",
      durationSeconds: videoDurations[video.videoId]?.durationSeconds || 0,
    }));

    const newPlaylist = new Playlist({
      playlistId,
      title: playlistTitle,
      videos,
      owner: userId,
      topics: normalizePlaylistTopics(req.body?.topics || []),
      inviteToken: crypto.randomBytes(16).toString("hex"),
    });

    await newPlaylist.save();

    trackEvent(userId, "playlist_imported", {
      playlistId: newPlaylist.playlistId,
      title: newPlaylist.title,
      videoCount: newPlaylist.videos.length,
    });

    return res.status(201).json({
      message: "Playlist created successfully",
      totalVideos: videos.length,
      playlist: newPlaylist,
    });
  } catch (error) {
    console.error("Error creating playlist:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserPlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const playlists = await Playlist.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .populate("owner members", "name email username avatar isPremium plan premiumExpiresAt")
      .sort({ updatedAt: -1 }).lean();

    const normalized = playlists.map((playlist) => ({
      _id: playlist._id,
      playlistId: playlist.playlistId,
      title: playlist.title,
      owner: formatMember(playlist.owner),
      members: (playlist.members || []).map(formatMember),
      isPublic: playlist.isPublic,
      topics: normalizePlaylistTopics(playlist.topics || []),
      inviteToken: playlist.inviteToken,
      videos: playlist.videos,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    }));

    return res.status(200).json({ playlists: normalized });
  } catch (error) {
    console.error("Error fetching playlists:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getExplorePlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true })
      .populate("owner", "name email username avatar isPremium plan premiumExpiresAt")
      .sort({ updatedAt: -1 }).lean();

    const explorePlaylists = playlists.map((playlist) => ({
      playlistId: playlist.playlistId,
      title: playlist.title,
      owner: formatMember(playlist.owner),
      videoCount: playlist.videos.length,
      memberCount: (playlist.members?.length || 0) + 1,
      thumbnail: playlist.videos?.[0]?.thumbnail || null,
      isPublic: playlist.isPublic,
      topics: normalizePlaylistTopics(playlist.topics || []),
      updatedAt: playlist.updatedAt,
    }));

    return res.json({
      playlists: explorePlaylists,
      availableTopics: buildAvailablePlaylistTopics(playlists),
    });
  } catch (error) {
    console.error("Error loading explore playlists", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const markVideoCompleted = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;
    const { playlist, error } = await assertPlaylistAccess(playlistId, req.user._id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    const userProgress = ensureProgressEntry(playlist, req.user._id);
    const wasAlreadyCompleted = userProgress.completedVideos.includes(videoId);
    if (!wasAlreadyCompleted) {
      userProgress.completedVideos.push(videoId);
    }

    await playlist.save();

    if (!wasAlreadyCompleted) {
      trackEvent(req.user._id, "video_marked_complete", {
        playlistId,
        videoId,
      });
    }

    return res.status(200).json({ message: "Video marked as completed" });
  } catch (error) {
    console.error("Error marking video completed", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPlaylistDetail = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { playlist, error } = await assertPlaylistAccess(playlistId, req.user._id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    const { totalSeconds, totalHours, userStats } = computePlaylistStats(playlist);
    const requesterId = String(req.user._id);
    const requesterProgress = playlist.progress.find((entry) => String(entry.user?._id || entry.user) === requesterId);
    const completedSet = new Set(requesterProgress?.completedVideos || []);
    const noteByVideoId = new Map(
      (playlist.videoNotes || [])
        .filter((note) => getEntityId(note?.user) === requesterId)
        .map((note) => [note.videoId, note])
    );
    const todayKey = getDateKeyInTimezone(new Date(), DEFAULT_TIMEZONE);
    const todayMinutes = requesterProgress?.dailyMinutes?.find((entry) => entry.date === todayKey)?.minutes || 0;

    const videos = playlist.videos.map((video) => {
      const videoNote = noteByVideoId.get(video.videoId);
      return {
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.duration,
        durationSeconds: video.durationSeconds,
        completed: completedSet.has(video.videoId),
        note: videoNote?.content || "",
        noteUpdatedAt: videoNote?.updatedAt || null,
      };
    });

    return res.status(200).json({
      playlist: {
        playlistId: playlist.playlistId,
        title: playlist.title,
        owner: formatMember(playlist.owner),
        members: (playlist.members || []).map(formatMember),
        videos,
        isPublic: playlist.isPublic,
        topics: normalizePlaylistTopics(playlist.topics || []),
        inviteToken: isPlaylistOwner(playlist, req.user._id) ? playlist.inviteToken : null,
        totals: { totalSeconds, totalHours },
        userStats,
        access: {
          isOwner: isPlaylistOwner(playlist, req.user._id),
          isMember: isPlaylistMember(playlist, req.user._id),
        },
        requesterProgress: {
          completedVideos: requesterProgress?.completedVideos || [],
          currentStreak: requesterProgress?.currentStreak || 0,
          longestStreak: requesterProgress?.longestStreak || 0,
          todayMinutes: +Number(todayMinutes || 0).toFixed(2),
          streakTimezone: DEFAULT_TIMEZONE,
        },
      },
    });
  } catch (error) {
    console.error("getPlaylistDetail error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const saveVideoNote = async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    const { content } = req.body || {};

    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 5000) {
      return res.status(400).json({ message: "Notes must be 5000 characters or fewer" });
    }

    const { playlist, error } = await assertPlaylistAccess(playlistId, req.user._id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    const videoExists = (playlist.videos || []).some((video) => video.videoId === videoId);
    if (!videoExists) {
      return res.status(404).json({ message: "Video not found in this playlist" });
    }

    playlist.videoNotes = playlist.videoNotes || [];
    const requesterId = String(req.user._id);
    const existingNoteIndex = playlist.videoNotes.findIndex(
      (note) => note.videoId === videoId && getEntityId(note?.user || note?.updatedBy) === requesterId
    );

    if (!trimmedContent) {
      if (existingNoteIndex !== -1) {
        playlist.videoNotes.splice(existingNoteIndex, 1);
        await playlist.save();
      }

      return res.status(200).json({
        message: "Video note cleared",
        note: {
          videoId,
          content: "",
          updatedAt: null,
        },
      });
    }

    const nextNote = {
      videoId,
      user: req.user._id,
      content: trimmedContent,
      updatedAt: new Date(),
    };

    if (existingNoteIndex === -1) {
      playlist.videoNotes.push(nextNote);
    } else {
      playlist.videoNotes.splice(existingNoteIndex, 1, nextNote);
    }

    await playlist.save();
    await playlist.populate("videoNotes.user", "name email username avatar isPremium plan premiumExpiresAt");

    const savedNote = playlist.videoNotes.find(
      (note) => note.videoId === videoId && getEntityId(note?.user) === requesterId
    );
    return res.status(200).json({
      message: "Video note saved",
      note: {
        videoId,
        content: savedNote?.content || "",
        updatedAt: savedNote?.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("saveVideoNote error", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const unmarkVideoCompleted = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;
    const { playlist, error } = await assertPlaylistAccess(playlistId, req.user._id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    const userProgress = ensureProgressEntry(playlist, req.user._id);
    userProgress.completedVideos = userProgress.completedVideos.filter((value) => value !== videoId);

    await playlist.save();
    return res.status(200).json({ message: "Video unmarked" });
  } catch (error) {
    console.error("unmarkVideoCompleted error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const generateInviteToken = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { regenerate = false } = req.body || {};
    const playlist = await Playlist.findOne({ playlistId }).populate("owner", "isPremium plan premiumExpiresAt").select("playlistId inviteToken owner");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!isPlaylistOwner(playlist, req.user._id)) {
      return res.status(403).json({ message: "Only the owner can manage invites" });
    }

    if (!playlist.inviteToken || regenerate) {
      playlist.inviteToken = crypto.randomBytes(16).toString("hex");
      await playlist.save();
    }

    const inviteLink = `${FRONTEND_BASE_URL}/join/${playlist.inviteToken}`;
    return res.status(200).json({
      message: regenerate ? "Invite link regenerated" : "Invite link ready",
      inviteLink,
      token: playlist.inviteToken,
    });
  } catch (error) {
    console.error("Error generating invite token:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const joinPlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const token = extractInviteToken(req.body?.token);
    const publicPlaylistId = req.body?.playlistId?.trim();
    const joinMethod = token ? "invite" : "explore";

    let playlist = req.joinTargetPlaylist || null;
    if (!playlist && token) {
      playlist = await Playlist.findOne({ inviteToken: token }).populate("owner", "isPremium plan premiumExpiresAt");
    } else if (!playlist && publicPlaylistId) {
      playlist = await Playlist.findOne({ playlistId: publicPlaylistId, isPublic: true }).populate("owner", "isPremium plan premiumExpiresAt");
    }

    if (!playlist) {
      return res.status(400).json({ message: "Invalid invite or playlist is not available" });
    }

    normalizePlaylistState(playlist);

    if (isPlaylistOwner(playlist, userId) || isPlaylistMember(playlist, userId)) {
      return res.status(200).json({
        message: "Already a member",
        playlistId: playlist.playlistId,
        title: playlist.title,
      });
    }

    await Playlist.updateOne({ _id: playlist._id }, { $addToSet: { members: userId } });

    trackEvent(userId, "playlist_joined", {
      playlistId: playlist.playlistId,
      method: joinMethod,
    });

    return res.status(200).json({
      message: "Joined playlist successfully",
      playlistId: playlist.playlistId,
      title: playlist.title,
    });
  } catch (error) {
    console.error("Error joining playlist:", error.message);
    return res.status(error.status || 500).json(error.body || { message: "Server error" });
  }
};

export const leavePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await Playlist.findOne({ playlistId }).populate("owner", "isPremium plan premiumExpiresAt").select("playlistId owner members");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (isPlaylistOwner(playlist, req.user._id)) {
      return res.status(400).json({ message: "Owners cannot leave a playlist. Delete it instead." });
    }

    if (!isPlaylistMember(playlist, req.user._id)) {
      return res.status(400).json({ message: "You are not a member of this playlist" });
    }

    playlist.members = playlist.members.filter((member) => String(member) !== String(req.user._id));
    await playlist.save();

    return res.json({ message: "You left the playlist. Your progress has been preserved." });
  } catch (error) {
    console.error("leavePlaylist error", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { playlistId, userId } = req.params;
    const playlist = await Playlist.findOne({ playlistId }).select("playlistId owner members");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!isPlaylistOwner(playlist, req.user._id)) {
      return res.status(403).json({ message: "Only the owner can remove members" });
    }

    playlist.members = playlist.members.filter((member) => String(member) !== String(userId));
    await playlist.save();

    return res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("removeMember error", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePlaylistVisibility = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { isPublic, topics } = req.body || {};
    const playlist = await Playlist.findOne({ playlistId }).select("playlistId owner isPublic topics");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!isPlaylistOwner(playlist, req.user._id)) {
      return res.status(403).json({ message: "Only the owner can change visibility" });
    }

    if (topics !== undefined && !Array.isArray(topics)) {
      return res.status(400).json({ message: "topics must be an array" });
    }

    const nextIsPublic = typeof isPublic === "boolean" ? isPublic : playlist.isPublic;
    const normalizedTopics = normalizePlaylistTopics(topics !== undefined ? topics : playlist.topics || []);

    if (nextIsPublic && normalizedTopics.length === 0) {
      return res.status(400).json({ message: "Choose at least one topic before making this playlist public" });
    }

    playlist.isPublic = nextIsPublic;
    playlist.topics = normalizedTopics;
    await playlist.save();

    return res.json({
      message: `Playlist is now ${playlist.isPublic ? "public" : "private"}`,
      isPublic: playlist.isPublic,
      topics: playlist.topics,
    });
  } catch (error) {
    console.error("updatePlaylistVisibility error", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logPlaylistTime = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const minutesSpent = Number(req.body?.minutesSpent || 0);
    if (!Number.isFinite(minutesSpent) || minutesSpent <= 0) {
      return res.status(400).json({ message: "minutesSpent must be a positive number" });
    }

    const { playlist, error } = await assertPlaylistAccess(playlistId, req.user._id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    const userProgress = ensureProgressEntry(playlist, req.user._id);
    const previousStreak = userProgress.currentStreak || 0;
    const todayKey = getDateKeyInTimezone(new Date(), DEFAULT_TIMEZONE);
    const dailyEntry = userProgress.dailyMinutes.find((entry) => entry.date === todayKey);

    if (dailyEntry) {
      dailyEntry.minutes = +Number(dailyEntry.minutes + minutesSpent).toFixed(2);
    } else {
      userProgress.dailyMinutes.push({ date: todayKey, minutes: +Number(minutesSpent).toFixed(2) });
    }

    const streakStats = computeStreakStats(userProgress.dailyMinutes, todayKey);
    userProgress.currentStreak = streakStats.currentStreak;
    userProgress.longestStreak = streakStats.longestStreak;
    userProgress.lastStreakDate = streakStats.lastStreakDate;

    await playlist.save();

    if (userProgress.currentStreak > previousStreak) {
      trackEvent(req.user._id, "streak_updated", {
        playlistId,
        currentStreak: userProgress.currentStreak,
      });
    }

    const todayMinutes = userProgress.dailyMinutes.find((entry) => entry.date === todayKey)?.minutes || 0;
    return res.json({
      message: "Time logged",
      streak: {
        currentStreak: userProgress.currentStreak,
        longestStreak: userProgress.longestStreak,
        lastStreakDate: userProgress.lastStreakDate,
        todayMinutes: +Number(todayMinutes).toFixed(2),
        timeZone: DEFAULT_TIMEZONE,
      },
    });
  } catch (error) {
    console.error("logPlaylistTime error", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const uploadChatMedia = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { fileData, mimeType } = req.body || {};
    const { playlist, error } = await assertPlaylistAccess(playlistId, req.user._id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    if (!fileData || !mimeType) {
      return res.status(400).json({ message: "fileData and mimeType are required" });
    }

    let messageType = null;
    if (mimeType.startsWith("image/")) {
      messageType = "image";
    } else if (mimeType.startsWith("audio/")) {
      messageType = "voice";
    } else {
      return res.status(400).json({ message: "Only image and audio uploads are supported" });
    }

    const mediaUrl = await uploadToCloudinary(fileData, messageType);
    return res.json({
      message: "Upload successful",
      playlistId: playlist.playlistId,
      mediaUrl,
      messageType,
    });
  } catch (error) {
    console.error("uploadChatMedia error", error.message);
    return res.status(error.status || 500).json(error.body || { message: "Server error" });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await Playlist.findOne({ playlistId }).select("_id owner");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!isPlaylistOwner(playlist, req.user._id)) {
      return res.status(403).json({ message: "Only the owner can delete this playlist" });
    }

    await ChatMessage.deleteMany({ playlist: playlist._id });
    await Playlist.deleteOne({ _id: playlist._id });

    return res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getChatMessage = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { playlist, error } = await assertPlaylistAccess(playlistId, req.user._id);
    if (error) {
      return res.status(error.status).json(error.body);
    }

    const chats = await ChatMessage.find({ playlist: playlist._id })
      .populate("sender", "name email username avatar isPremium plan premiumExpiresAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      chats: chats.map((chat) => ({
        _id: chat._id,
        message: chat.message,
        messageType: chat.messageType,
        mediaUrl: chat.mediaUrl,
        createdAt: chat.createdAt,
        sender: formatMember(chat.sender),
      })),
    });
  } catch (error) {
    console.error("getChatMessage error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
