const express = require("express");
const router = express.Router();

const {
  registerPatient,
  loginPatient
} = require("../controllers/authController");

const auth = require("../middleware/authMiddleware");

/* ================= AUTH ================= */

router.post("/register", registerPatient);
router.post("/login", loginPatient);

/* ================= PROFILE ================= */

router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
