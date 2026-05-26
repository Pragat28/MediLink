const express = require("express");
const router = express.Router();

const {
  getDoctorProfile,
  updateDoctorProfile
} = require("../controllers/doctorProfileController");

const authDoctor = require("../middleware/authDoctor");
const upload = require("../config/multer");
// reuse multer

// View profile
router.get("/me", authDoctor, getDoctorProfile);

// Update profile (now supports photo upload)
router.put(
  "/me",
  authDoctor,
  upload.single("photo"),
  updateDoctorProfile
);

module.exports = router;
