const express = require("express");
const router = express.Router();

const {
  registerPatient,
  loginPatient,
  verifyPatientOtp,          // ✅ NEW
  verifyPatientLoginOtp      // ✅ NEW
} = require("../controllers/authController");

const auth = require("../middleware/authMiddleware");

/* ================= AUTH ================= */

router.post("/register", registerPatient);
router.post("/login", loginPatient);

/* 🔥 NEW OTP ROUTES */

router.post("/verify-otp", verifyPatientOtp);
router.post("/verify-login-otp", verifyPatientLoginOtp);

/* ================= PROFILE ================= */

router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;