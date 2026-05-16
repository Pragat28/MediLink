const mongoose = require("mongoose");

const illnessSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },

    // Symptoms user selected
    symptoms: {
      type: [String],   // e.g. ["chest pain", "fatigue"]
      required: true
    },

    // Output of prediction algorithm
    matchedConditions: {
      type: [String],   // e.g. ["cardiac issue", "poor circulation"]
      default: []
    },

    recommendedSpecialty: {
      type: String      // e.g. "Cardiologist"
    },

    // Status of illness
    status: {
      type: String,
      enum: ["pending", "consulted", "resolved"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Illness", illnessSchema);
