const Appointment = require("../models/appointmentModel");
const Patient = require("../models/patientModel");

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
        mode: appt.mode, // 🔥 ADD THIS
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
    }).populate("patient", "name email"); // ✅ populate patient email

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found or already processed"
      });
    }

    appointment.status = "accepted";
    await appointment.save();

    // ✅ Return patient email + reminder messages in response
    res.json({
        message: "Appointment approved",
        patientEmail: appointment.patient.email,
        patientName: appointment.patient.name,
        slotTime: appointment.slotTime,
        date: appointment.date,
        mode: appointment.mode, // 🔥 ADD THIS
        doctorReminder: `Please send the meeting link to the patient's email: ${appointment.patient.email} before the appointment at ${appointment.slotTime} on ${new Date(appointment.date).toLocaleDateString()}.`,
        patientMessage: `Your appointment has been confirmed! The doctor will send you the meeting link on your registered email (${appointment.patient.email}) before the appointment time.`
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
 * VERIFY USING PATIENT CODE
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

    if (appointment.patientCode !== code) {
      return res.status(400).json({
        message: "Invalid patient code"
      });
    }

    const today = new Date();
    const appointmentDate = new Date(appointment.date);

    const todayStr = new Date().toISOString().split("T")[0];
    const appointmentStr = new Date(appointment.date).toISOString().split("T")[0];
    
    if (todayStr < appointmentStr) {
      return res.status(400).json({
        message: "Appointment cannot be completed before the appointment date"
      });
    }

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
 * DOCTOR → GET CONFIRMED APPOINTMENTS FOR CALENDAR
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
