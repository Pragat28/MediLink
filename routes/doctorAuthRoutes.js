const express = require("express");
const router = express.Router();

const {
  registerDoctor,
  loginDoctor
} = require("../controllers/doctorAuthController");

const upload = require("../config/multer");

/* ================= AUTH ROUTES ================= */

// ✅ Register (with photo upload)
router.post("/register", registerDoctor);

// ✅ Login (direct login, no OTP)
router.post("/login", loginDoctor);

module.exports = router;
