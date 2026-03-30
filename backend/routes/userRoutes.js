import express from "express";
import { registerUser, loginUser, getCurrentUser, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
router.patch("/profile", protect, updateProfile);

export default router;

