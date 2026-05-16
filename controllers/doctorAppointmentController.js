const Appointment = require("../models/appointmentModel");

/**
 * GET all appointment requests for logged-in doctor
 * grouped by patient
 */
exports.getAppointmentRequests = async (req, res) => {
  try {

    const appointments = await Appointment.find({
      doctor: req.user.id,
      status: { $ne: "expired" }
    })
      .populate("patient", "name email")
      .sort({ createdAt: -1 });

    const grouped = {};

    appointments.forEach((appt) => {

      const patientId = appt.patient._id.toString();

      if (!grouped[patientId]) {
        grouped[patientId] = {
          patient: appt.patient,
          requests: []
        };
      }

      grouped[patientId].requests.push({
        appointmentId: appt._id,
        date: appt.date,
        slotTime: appt.slotTime,
        status: appt.status,

        // (can keep or remove, not used anymore)
        verificationCode: appt.verificationCode || null,

        rating: appt.rating || null,
        review: appt.review || "",
        rated: appt.rated || false
      });

    });

    res.json(Object.values(grouped));

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * APPROVE appointment
 */
exports.approveAppointment = async (req, res) => {
  try {

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user.id,
      status: "pending"
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found or already processed"
      });
    }

    appointment.status = "accepted";
    await appointment.save();

    res.json({
      message: "Appointment approved"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * REJECT appointment
 */
exports.rejectAppointment = async (req, res) => {
  try {

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user.id,
      status: "pending"
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found or already processed"
      });
    }

    appointment.status = "rejected";
    await appointment.save();

    res.json({
      message: "Appointment rejected successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * CANCEL appointment by doctor
 */
exports.cancelAppointmentByDoctor = async (req, res) => {
  try {

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "Appointment already cancelled"
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.json({
      message: "Appointment cancelled by doctor",
      appointment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ UPDATED: VERIFY USING PATIENT CODE
 */
exports.verifyAppointment = async (req, res) => {
  try {

    const { appointmentId, code } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    if (appointment.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted appointments can be verified"
      });
    }

    // ✅ NEW: CHECK PATIENT CODE (NOT verificationCode)
    if (appointment.patientCode !== code) {
      return res.status(400).json({
        message: "Invalid patient code"
      });
    }

    // ✅ DATE CHECK (UNCHANGED)
    const today = new Date();
    const appointmentDate = new Date(appointment.date);

    today.setHours(0,0,0,0);
    appointmentDate.setHours(0,0,0,0);

    if (today < appointmentDate) {
      return res.status(400).json({
        message: "Appointment cannot be completed before the appointment date"
      });
    }

    // ✅ COMPLETE
    appointment.status = "completed";
    await appointment.save();

    res.json({
      message: "Appointment verified & completed",
      appointment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🗓 DOCTOR → GET CONFIRMED APPOINTMENTS FOR CALENDAR
 */
exports.getDoctorCalendar = async (req, res) => {
  try {

    const appointments = await Appointment.find({
      doctor: req.user.id,
      status: "accepted"
    })
      .populate("patient", "name")
      .sort({ date: 1 });

    res.json(appointments);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};