const express = require("express");
const router = express.Router();

const {
  searchDoctors,
  getDoctorProfile,
  getFilterOptions,
  requestAppointment,
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

/* View doctor profile */
router.get("/:id", getDoctorProfile);

/* ⭐ REQUEST APPOINTMENT */
router.post("/request-appointment", authMiddleware, requestAppointment);


module.exports = router;