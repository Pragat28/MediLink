const express = require("express");
const router = express.Router();

const {
  getAppointmentRequests,
  approveAppointment,
  rejectAppointment,
  cancelAppointmentByDoctor,
  getDoctorCalendar,
  verifyAppointment // ✅ ADDED
} = require("../controllers/doctorAppointmentController");

const authDoctor = require("../middleware/authDoctor");

/**
 * ================================
 * DOCTOR → APPOINTMENT ACTIONS
 * ================================
 */

// View all appointment requests for doctor
router.get("/appointments", authDoctor, getAppointmentRequests);

// 🗓 Get confirmed appointments for calendar
router.get("/appointments/calendar", authDoctor, getDoctorCalendar);

// Approve appointment
router.put("/appointments/:id/approve", authDoctor, approveAppointment);

// Reject appointment
router.put("/appointments/:id/reject", authDoctor, rejectAppointment);

// Cancel appointment (after approving)
router.put("/appointments/:id/cancel", authDoctor, cancelAppointmentByDoctor);

// ✅ NEW: VERIFY + COMPLETE
router.put("/verify", authDoctor, verifyAppointment);

module.exports = router;