const express = require("express");
const router = express.Router();

const {
  registerDoctor,
  loginDoctor
} = require("../controllers/doctorAuthController");

const upload = require("../middleware/uploadDoctorPhoto");

/* ================= AUTH ROUTES ================= */

// ✅ Register (with photo upload)
router.post("/register", upload.single("photo"), registerDoctor);

// ✅ Login (direct login, no OTP)
router.post("/login", loginDoctor);

module.exports = router;
