import express from "express";
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
  unmarkVideoCompleted,
  updatePlaylistVisibility,
  uploadChatMedia,
} from "../controllers/playlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/explore", getExplorePlaylists);
router.post("/create", protect, createPlaylist);
router.get("/my-playlists", protect, getUserPlaylist);
router.post("/mark", protect, markVideoCompleted);
router.post("/unmark", protect, unmarkVideoCompleted);
router.post("/join", protect, joinPlaylist);
router.get("/:playlistId/details", protect, getPlaylistDetail);
router.get("/:playlistId/chats", protect, getChatMessage);
router.post("/:playlistId/invite", protect, generateInviteToken);
router.post("/:playlistId/leave", protect, leavePlaylist);
router.delete("/:playlistId/members/:userId", protect, removeMember);
router.patch("/:playlistId/visibility", protect, updatePlaylistVisibility);
router.post("/:playlistId/time", protect, logPlaylistTime);
router.post("/:playlistId/chat/upload", protect, uploadChatMedia);
router.delete("/:playlistId", protect, deletePlaylist);

export default router;

