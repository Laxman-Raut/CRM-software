import express from "express";
import {
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;