import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from './routes/authRoutes.js'
import playlistRoutes from "./routes/playlistRoutes.js";
import http from "http";
import setupSocket from "./socket/index.js";;

dotenv.config();
console.log("PORT from .env:", process.env.PORT);

const app = express();
const server = http.createServer(app);

app.use(cors()); 
app.use(express.json()); 
app.use("/api/users", userRoutes);
app.use("/api/users", authRoutes); 
app.use("/api/playlists", playlistRoutes);


app.get("/", (req, res) => {
  res.send("Welcome to PrepTube");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));