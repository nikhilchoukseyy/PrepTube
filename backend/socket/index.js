import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatMessage from "../models/ChatMessage.js";
// ✅ FIX: Import Playlist so we can look up its MongoDB _id
import Playlist from "../models/Playlist.js";

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.user.id);

    socket.on("joinRoom", ({ playlistId }) => {
      socket.join(playlistId);
      console.log(`✅ User ${socket.user.id} joined room ${playlistId}`);
    });

    socket.on("chatMessage", async ({ playlistId, text }) => {
      try {
        
        const playlist = await Playlist.findOne({ playlistId });
        if (!playlist) {
          return socket.emit("error", { message: "Playlist not found" });
        }

        
        const chat = await ChatMessage.create({
          playlist: playlist._id,
          sender: socket.user.id,
          message: text,
        });

        io.to(playlistId).emit("newMessage", {
          ...chat.toObject(),
          sender: socket.user,
        });
      } catch (err) {
        console.error("❌ Chat message error:", err.message);
      }
    });

    socket.on("leaveRoom", ({ playlistId }) => {
      socket.leave(playlistId);
      console.log(`🚪 User ${socket.user.id} left room ${playlistId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 User ${socket.user.id} disconnected`);
    });
  });

  return io;
}