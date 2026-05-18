const express = require("express");
const router = express.Router();

const {
  registerDoctor,
  loginDoctor,
  verifyDoctorOtp,
  verifyLoginOtp,
  resendOtp // ✅ ADD THIS
} = require("../controllers/doctorAuthController");

const upload = require("../middleware/uploadDoctorPhoto");

/* ================= AUTH ROUTES ================= */

// ✅ Register (with photo upload)
router.post("/register", upload.single("photo"), registerDoctor);

// ✅ Login (password → OTP)
router.post("/login", loginDoctor);

// ✅ Verify Register OTP
router.post("/verify-otp", verifyDoctorOtp);

// ✅ Verify Login OTP
router.post("/verify-login-otp", verifyLoginOtp);

// ✅ 🔥 NEW: Resend OTP
router.post("/resend-otp", resendOtp);

module.exports = router;
