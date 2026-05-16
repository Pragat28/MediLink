const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
{
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },

  // Appointment date
  date: {
    type: Date,
    required: true
  },

  // Slot time (IMPORTANT: should match "start-end")
  // example: "10:00-10:30"
  slotTime: {
    type: String,
    required: true,
    trim: true
  },

  // Appointment status
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "rejected",
      "cancelled",
      "expired",
      "completed"
    ],
    default: "pending"
  },

  patientCode: {
  type: String,
  required: true
  },

  // ⭐ Patient rating (1–5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },

  // 📝 Optional patient review
  review: {
    type: String,
    trim: true,
    default: ""
  },

  // Prevent rating twice
  rated: {
    type: Boolean,
    default: false
  }

},
{ timestamps: true }
);

/**
 * 🔒 Prevent duplicate appointment requests
 */
appointmentSchema.index(
  { patient: 1, doctor: 1, date: 1, slotTime: 1 },
  { unique: true }
);

/**
 * ✅ (OPTIONAL BUT GOOD) INDEX FOR FAST SLOT CHECK
 */
appointmentSchema.index({
  doctor: 1,
  date: 1,
  slotTime: 1,
  status: 1
});

module.exports = mongoose.model("Appointment", appointmentSchema);