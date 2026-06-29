import express from "express";
import {
  registerUser,
  verifyEmailOtp,
  resendVerificationOtp,
  loginUser,
  googleLogin,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  logoutUser,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmailOtp);
router.post("/resend-verification-otp", resendVerificationOtp);

router.post("/login", loginUser);
router.post("/google-login", googleLogin);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyPasswordResetOtp);
router.post("/reset-password", resetPassword);

router.post("/logout", logoutUser);
router.get("/me", protect, getMe);

export default router;