const express = require("express");
const router = express.Router();

const {
  getPatientProfile,
  updatePatientProfile,
  addMedication,
  removeMedication,
  removeChronicDisease,
  removeAllergy
} = require("../controllers/patientController");

const authMiddleware = require("../middleware/authMiddleware");

const { getPatientAppointments } = require("../controllers/patientController");

router.get("/appointments", authMiddleware, getPatientAppointments);

/*
============================
PATIENT PROFILE ROUTES
============================
*/

// Get patient profile
router.get("/profile", authMiddleware, getPatientProfile);

// Update patient profile (handles pregnancy fields too)
router.put("/profile", authMiddleware, updatePatientProfile);


/*
============================
MEDICATION ROUTES
============================
*/

// Add medication
router.post("/medications", authMiddleware, addMedication);

// Remove medication
router.delete("/medications/:id", authMiddleware, removeMedication);


/*
============================
CHRONIC DISEASE ROUTES
============================
*/

// Remove chronic disease
router.delete("/diseases/:name", authMiddleware, removeChronicDisease);


/*
============================
ALLERGY ROUTES
============================
*/

// Remove allergy
router.delete("/allergies/:name", authMiddleware, removeAllergy);


module.exports = router;