import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatMessage from "../models/ChatMessage.js";
import Playlist from "../models/Playlist.js";
import User from "../models/User.js";
import { canAccessPlaylist, canViewPlaylist } from "../utils/playlistAccess.js";
import { buildAvatarUrl, serializeUser } from "../utils/userIdentity.js";
import { trackEvent } from "../utils/analytics.js";

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

function formatSocketUser(user) {
  const serialized = serializeUser(user);
  return {
    _id: String(serialized.id),
    id: String(serialized.id),
    name: serialized.name,
    email: serialized.email,
    username: serialized.username,
    avatar: serialized.avatar || buildAvatarUrl(serialized.username || serialized.name || serialized.email),
    plan: serialized.plan,
    role: serialized.role,
  };
}

export default function setupSocket(server) {
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });
  ioInstance = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name email username avatar isPremium plan premiumExpiresAt role");
      if (!user) {
        return next(new Error("Authentication error"));
      }
      socket.user = formatSocketUser(user);
      return next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", async ({ playlistId }) => {
      const playlist = await Playlist.findOne({ playlistId }).populate("owner members");
      if (!playlist || !canViewPlaylist(playlist, socket.user)) {
        return socket.emit("error", { message: "You do not have access to this playlist" });
      }

      socket.join(playlistId);
    });

    socket.on("chatMessage", async ({ playlistId, text = "", messageType = "text", mediaUrl = "" }) => {
      try {
        const playlist = await Playlist.findOne({ playlistId }).populate("owner members");
        if (!playlist) {
          return socket.emit("error", { message: "Playlist not found" });
        }

        if (!canAccessPlaylist(playlist, socket.user)) {
          return socket.emit("error", { message: "You do not have access to this playlist" });
        }

        if (messageType === "text" && !text.trim()) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }

        if (["image", "voice"].includes(messageType) && !mediaUrl) {
          return socket.emit("error", { message: "Media message is missing a mediaUrl" });
        }

        const chat = await ChatMessage.create({
          playlist: playlist._id,
          sender: socket.user.id,
          message: text,
          messageType,
          mediaUrl,
        });

        trackEvent(socket.user.id, "chat_message_sent", {
          playlistId,
          messageType,
        });

        io.to(playlistId).emit("newMessage", {
          _id: String(chat._id),
          message: chat.message,
          messageType: chat.messageType,
          mediaUrl: chat.mediaUrl,
          createdAt: chat.createdAt,
          sender: socket.user,
        });
      } catch (err) {
        console.error("Chat message error:", err.message);
        socket.emit("error", { message: "Unable to send message" });
      }
    });

    socket.on("leaveRoom", ({ playlistId }) => {
      socket.leave(playlistId);
    });
  });

  return io;
}

