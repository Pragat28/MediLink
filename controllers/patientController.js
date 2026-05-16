const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");

/**
 * GET PATIENT PROFILE
 */
exports.getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id)
      .select("-password")
      .populate("history");

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    res.json(patient);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * UPDATE PATIENT PROFILE
 */
exports.updatePatientProfile = async (req, res) => {
  try {

    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const {
      name,
      age,
      gender,
      height,
      weight,
      isPregnant,
      pregnancyMonths,
      numberOfKids,
      lastPregnancyYear,
      bloodGroup,
      contactNumber,
      birthDate,
      pastSurgeriesMedicalComplications,
      chronicDiseases,
      allergies,
      medications,
    } = req.body;

    // Basic fields
    patient.name = name ?? patient.name;
    patient.age = age ?? patient.age;
    patient.gender = gender ?? patient.gender;
    patient.height = height ?? patient.height;
    patient.weight = weight ?? patient.weight;

    // Personal info
    patient.bloodGroup = bloodGroup ?? patient.bloodGroup;
    patient.contactNumber = contactNumber ?? patient.contactNumber;

    if (birthDate) {
      patient.birthDate = new Date(birthDate);
    }

    // Past surgeries
    patient.pastSurgeriesMedicalComplications =
      Array.isArray(pastSurgeriesMedicalComplications)
        ? pastSurgeriesMedicalComplications
        : patient.pastSurgeriesMedicalComplications || [];

    // Pregnancy
    patient.isPregnant = isPregnant ?? patient.isPregnant;
    patient.pregnancyMonths = pregnancyMonths ?? patient.pregnancyMonths;
    patient.numberOfKids = numberOfKids ?? patient.numberOfKids;
    patient.lastPregnancyYear = lastPregnancyYear ?? patient.lastPregnancyYear;

    // Arrays
    patient.chronicDiseases = Array.isArray(chronicDiseases)
      ? chronicDiseases
      : patient.chronicDiseases || [];

    patient.allergies = Array.isArray(allergies)
      ? allergies
      : patient.allergies || [];

    patient.medications = Array.isArray(medications)
      ? medications
      : patient.medications || [];

    const updatedPatient = await patient.save();

    res.json(updatedPatient);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * ADD MEDICATION
 */
exports.addMedication = async (req, res) => {
  try {

    const { name, dosage } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({
        message: "Medication name and dosage required",
      });
    }

    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    patient.medications.push({ name, dosage });

    await patient.save();

    res.json({
      message: "Medication added",
      medications: patient.medications,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * REMOVE MEDICATION
 */
exports.removeMedication = async (req, res) => {
  try {

    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    patient.medications = patient.medications.filter(
      (med) => med._id.toString() !== req.params.id
    );

    await patient.save();

    res.json({
      message: "Medication removed",
      medications: patient.medications,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * REMOVE CHRONIC DISEASE
 */
exports.removeChronicDisease = async (req, res) => {
  try {

    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    patient.chronicDiseases = patient.chronicDiseases.filter(
      (disease) => disease !== req.params.name
    );

    await patient.save();

    res.json({
      message: "Disease removed",
      chronicDiseases: patient.chronicDiseases,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * REMOVE ALLERGY
 */
exports.removeAllergy = async (req, res) => {
  try {

    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    patient.allergies = patient.allergies.filter(
      (allergy) => allergy !== req.params.name
    );

    await patient.save();

    res.json({
      message: "Allergy removed",
      allergies: patient.allergies,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * GET PATIENT APPOINTMENTS
 */
exports.getPatientAppointments = async (req, res) => {
  try {

    const appointments = await Appointment.find({
      patient: req.user.id
    })
    .populate("doctor", "name email contactNumber")
    .sort({ date: -1 });

    res.json({
      count: appointments.length,
      appointments
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};