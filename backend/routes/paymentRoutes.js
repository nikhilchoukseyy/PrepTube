import express from "express";
import { createOrder, handleWebhook, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);
router.use(express.json());

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

export default router;
