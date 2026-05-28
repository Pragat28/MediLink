const express = require("express");
const router = express.Router();
const {
  searchDoctors,
  getDoctorProfile,
  getFilterOptions,
  requestAppointment,
  getDoctorReviews,
} = require("../controllers/doctorController");
const authMiddleware = require("../middleware/authMiddleware");

/*
  ======================
  PATIENT SIDE
  ======================
*/

/* Get available filter options (areas) */
router.get("/filters", getFilterOptions);

/* Search doctors */
router.post("/search", searchDoctors);

/* Get doctor reviews — must be before /:id to avoid conflict */
router.get("/:id/reviews", getDoctorReviews);

/* View doctor profile */
router.get("/:id", getDoctorProfile);

/* ⭐ REQUEST APPOINTMENT */
router.post("/request-appointment", authMiddleware, requestAppointment);

module.exports = router;
