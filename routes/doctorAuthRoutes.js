const express = require("express");
const router = express.Router();

const doctorAuthController = require("../controllers/doctorAuthController");

const upload = require("../middleware/uploadDoctorPhoto");

// 🔍 DEBUG (optional but useful)
console.log("registerDoctor:", typeof doctorAuthController.registerDoctor);
console.log("loginDoctor:", typeof doctorAuthController.loginDoctor);
console.log("verifyDoctorOtp:", typeof doctorAuthController.verifyDoctorOtp);
console.log("verifyLoginOtp:", typeof doctorAuthController.verifyLoginOtp);

// ✅ Register (with photo upload)
router.post(
  "/register",
  upload.single("photo"),
  doctorAuthController.registerDoctor
);

// ✅ Login
router.post(
  "/login",
  doctorAuthController.loginDoctor
);

// ✅ OTP ROUTES (SAFE CHECK)
if (doctorAuthController.verifyDoctorOtp) {
  router.post("/verify-otp", doctorAuthController.verifyDoctorOtp);
}

if (doctorAuthController.verifyLoginOtp) {
  router.post("/verify-login-otp", doctorAuthController.verifyLoginOtp);
}

module.exports = router;