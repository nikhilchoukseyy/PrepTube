import { Queue } from "bullmq";
import connection from "../config/redis.js";

export const syncQueue = new Queue("sync-playlist", {
  connection,
  defaultJobOptions: {
    attempts: 3,           
    backoff: {
      type: "exponential", 
      delay: 1000,
    },
    removeOnComplete: 100, 
    removeOnFail: 50,     
  },
});