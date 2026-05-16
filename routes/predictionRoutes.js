const express = require("express");
const router = express.Router();

const { predict, getHistory } = require("../controllers/predController");
const authMiddleware = require("../middleware/authMiddleware");

// Predict illness
router.post("/predict", authMiddleware, predict);

// Get patient history 
router.get("/history", authMiddleware, getHistory);

module.exports = router;
