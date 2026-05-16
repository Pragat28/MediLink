const express = require("express");
const router = express.Router();

const {
  adminLogin,
  getPendingDoctors,
  verifyDoctor,
  rejectDoctor
} = require("../controllers/adminController");

/* LOGIN */
router.post("/login", adminLogin);

/* DASHBOARD */
router.get("/pending-doctors", getPendingDoctors);

/* ACTIONS */
router.put("/verify-doctor/:id", verifyDoctor);
router.put("/reject-doctor/:id", rejectDoctor);

module.exports = router;