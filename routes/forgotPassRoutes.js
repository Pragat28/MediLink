const express = require("express");
const router = express.Router();

const {
  forgotPassword,
  verifyOtp,
  resetPassword
} = require("../controllers/forgetPassController");

/* ================= FORGOT PASSWORD ================= */

// ✅ Step 1 → Send OTP
router.post("/forgot-password", forgotPassword);

// ✅ Step 2 → Verify OTP
router.post("/verify-otp", verifyOtp);

// ✅ Step 3 → Reset Password
router.post("/reset-password", resetPassword);

module.exports = router;
