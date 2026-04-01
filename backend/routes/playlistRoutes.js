import express from "express";
import rateLimit from "express-rate-limit";
import {
  createPlaylist,
  deletePlaylist,
  generateInviteToken,
  getChatMessage,
  getExplorePlaylists,
  getPlaylistDetail,
  getUserPlaylist,
  joinPlaylist,
  leavePlaylist,
  logPlaylistTime,
  markVideoCompleted,
  removeMember,
  saveVideoNote,
  unmarkVideoCompleted,
  updatePlaylistVisibility,
  uploadChatMedia,
} from "../controllers/playlistController.js";
import { protect } from "../middleware/authMiddleware.js";
import { enforceMemberLimit } from "../middleware/planMiddleware.js";

const router = express.Router();
const playlistImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Import limit reached. Please wait before importing another playlist." },
});

router.get("/explore", getExplorePlaylists);
router.post("/create", playlistImportLimiter, protect, createPlaylist);
router.get("/my-playlists", protect, getUserPlaylist);
router.post("/mark", protect, markVideoCompleted);
router.post("/unmark", protect, unmarkVideoCompleted);
router.post("/join", protect, enforceMemberLimit, joinPlaylist);
router.get("/:playlistId/details", protect, getPlaylistDetail);
router.put("/:playlistId/videos/:videoId/note", protect, saveVideoNote);
router.get("/:playlistId/chats", protect, getChatMessage);
router.post("/:playlistId/invite", protect, generateInviteToken);
router.post("/:playlistId/leave", protect, leavePlaylist);
router.delete("/:playlistId/members/:userId", protect, removeMember);
router.patch("/:playlistId/visibility", protect, updatePlaylistVisibility);
router.post("/:playlistId/time", protect, logPlaylistTime);
router.post("/:playlistId/chat/upload", protect, uploadChatMedia);
router.delete("/:playlistId", protect, deletePlaylist);

export default router;
