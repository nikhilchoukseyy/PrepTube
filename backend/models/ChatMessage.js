import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    playlist: { required: true, type: mongoose.Schema.Types.ObjectId, ref: "Playlist" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: "" },
    messageType: {
      type: String,
      enum: ["text", "image", "voice"],
      default: "text",
    },
    mediaUrl: { type: String },
  },
  { timestamps: true }
);

const ChatMessage = mongoose.model("ChatMessage", chatSchema);
export default ChatMessage;

