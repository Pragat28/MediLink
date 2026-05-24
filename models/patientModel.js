const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
{
  name: { type: String },
  dosage: { type: String }
},
{ _id: false }
);

const patientSchema = new mongoose.Schema(
{
  // Auth
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  patientCode: {
    type: String,
    unique: true
  },

  // Contact
  contactNumber: {
    type: String
  },

  // Personal Info
  birthDate: {
    type: Date
  },

  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  },

  // Basic profile
  age: Number,
  gender: String,
  height: Number,
  weight: Number,

  // Pregnancy
  isPregnant: {
    type: Boolean,
    default: false
  },

  pregnancyMonths: {
    type: Number,
    default: null
  },

  numberOfKids: {
    type: Number,
    default: 0
  },

  lastPregnancyYear: {
    type: Number,
    default: null
  },

  // Chronic diseases
  chronicDiseases: {
    type: [String],
    default: []
  },

  // Allergies
  allergies: {
    type: [String],
    default: []
  },

  // Medications
  medications: {
    type: [medicationSchema],
    default: []
  },

  // Past medical history
  pastSurgeriesMedicalComplications: {
    type: [String],
    default: []
  },

  // Illness history
  history: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Illness"
  }
  ]

},
{ timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
