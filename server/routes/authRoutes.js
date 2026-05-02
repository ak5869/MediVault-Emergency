import express from "express";
import { signup, login, sendOtp, verifyOtp, forgotPassword, checkEmail } from "../controllers/authController.js";

const router = express.Router();

router.post("/register",        signup);
router.post("/login",           login);
router.post("/send-otp",        sendOtp);
router.post("/verify-otp",      verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/check-email",     checkEmail);

export default router;