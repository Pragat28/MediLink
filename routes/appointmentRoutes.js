const express = require("express");
const router = express.Router();

const {
  requestAppointment,
  getMyAppointments,
  cancelAppointmentByPatient,
  rateDoctor
} = require("../controllers/appointmentController");

// middleware
const authMiddleware = require("../middleware/authMiddleware");

/*
========================
PATIENT APPOINTMENT ROUTES
========================
*/

// Request appointment
router.post("/request", authMiddleware, requestAppointment);

// View my appointments
router.get("/my", authMiddleware, getMyAppointments);

// Cancel appointment
router.put("/:id/cancel", authMiddleware, cancelAppointmentByPatient);

// ⭐ Rate doctor after appointment completion
router.post("/:id/rate", authMiddleware, rateDoctor);

module.exports = router;