import express from "express";
import {
  createPlaylist,
  getUserPlaylist,
  markVideoCompleted,
  getPlaylistDetail,
  unmarkVideoCompleted,
  generateInviteToken,
  joinPlaylist,
  getChatMessage
} from "../controllers/playlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createPlaylist);
router.get("/my-playlists", protect, getUserPlaylist);
router.post("/mark", protect, markVideoCompleted);
router.get("/:playlistId/details", protect, getPlaylistDetail);
router.post("/unmark", protect, unmarkVideoCompleted);
router.post("/:playlistId/invite", protect, generateInviteToken);
router.post("/join", protect, joinPlaylist);
router.get("/:playlistId/chats",protect,getChatMessage);


export default router;
