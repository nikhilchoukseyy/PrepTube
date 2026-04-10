import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const connection = new Redis({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null, 
});

connection.on("connect", () => console.log("✅ Redis connected"));
connection.on("error", (err) => console.error("❌ Redis error:", err.message));

export default connection;