const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");

/**
 * PATIENT → REQUEST APPOINTMENT
 */
exports.requestAppointment = async (req, res) => {
  try {

    const patientId = req.user.id;
    const { doctorId, date, slotTime, mode } = req.body;

    if (!doctorId || !date || !slotTime || !mode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const today = new Date();
    const appointmentDate = new Date(date);

    today.setHours(0,0,0,0);
    appointmentDate.setHours(0,0,0,0);

    if (appointmentDate.getTime() < today.getTime()) {
      return res.status(400).json({
        message: "Cannot book appointment for past dates"
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    /**
     * RULE 1 → Only one accepted appointment
     */
    const acceptedAppointment = await Appointment.findOne({
      patient: patientId,
      status: "accepted"
    });

    if (acceptedAppointment) {
      return res.status(400).json({
        message:
          "You already have an accepted appointment. Wait until it is completed."
      });
    }

    /**
     * RULE 2 → Prevent duplicate request
     */
    const duplicateSlot = await Appointment.findOne({
      doctor: doctorId,
      patient: patientId,
      date,
      slotTime,
      status: { $in: ["pending", "accepted"] }
    });

    if (duplicateSlot) {
      return res.status(400).json({
        message: "You already requested this slot"
      });
    }

    /**
     * RULE 3 → SLOT CAPACITY
     */
    const day = new Date(date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const weeklySlots = doctor.availability?.weekly?.[day] || [];

    const override = (doctor.availability?.overrides || []).find(r => {
      const from = new Date(r.from).setHours(0,0,0,0);
      const to = new Date(r.to).setHours(0,0,0,0);
      const d = new Date(date).setHours(0,0,0,0);
      return d >= from && d <= to;
    });

    const slots = override ? override.slots : weeklySlots;

    const selectedSlot = slots.find(
      s => `${s.start}-${s.end}` === slotTime
    );

    if (!selectedSlot) {
      return res.status(400).json({
        message: "Invalid slot selected"
      });
    }

    // ✅ Validate mode matches slot mode
    if (selectedSlot.mode && selectedSlot.mode !== mode) {
      return res.status(400).json({
        message: `This slot is only available for ${selectedSlot.mode} consultations`
      });
    }

    // ✅ Count only accepted appointments for capacity check
    const count = await Appointment.countDocuments({
      doctor: doctorId,
      date,
      slotTime,
      status: "accepted"
    });

    if (count >= (selectedSlot.maxPatients || 1)) {
      return res.status(400).json({
        message: "This slot is full. Please choose another slot."
      });
    }

    /**
     * GET PATIENT CODE
     */
    const patient = await Patient.findById(patientId);

    /**
     * CREATE APPOINTMENT
     */
    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: patientId,
      date,
      slotTime,
      mode,
      status: "pending",
      patientCode: patient.patientCode
    });

    res.status(201).json({
      message: "Appointment request sent successfully",
      appointment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATIENT → VIEW MY APPOINTMENTS
 */
exports.getMyAppointments = async (req, res) => {
  try {

    const appointments = await Appointment.find({
      patient: req.user.id,
      status: { $ne: "expired" }
    })
      .populate("doctor", "name email phone specialty rating address")
      .sort({ createdAt: -1 });

    res.json({
      appointments
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATIENT → CANCEL APPOINTMENT
 */
exports.cancelAppointmentByPatient = async (req, res) => {
  try {

    const appointmentId = req.params.id;
    const patientId = req.user.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: patientId
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    if (!["pending", "accepted"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Cannot cancel this appointment"
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.json({
      message: "Appointment cancelled successfully",
      appointment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATIENT → RATE DOCTOR
 */
exports.rateDoctor = async (req, res) => {
  try {

    const appointmentId = req.params.id;
    const { rating, review } = req.body;
    const patientId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: patientId
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "You can only rate after appointment completion"
      });
    }

    if (appointment.rated) {
      return res.status(400).json({
        message: "You have already rated this appointment"
      });
    }

    appointment.rating = rating;
    appointment.review = review || "";
    appointment.rated = true;

    await appointment.save();

    const ratedAppointments = await Appointment.find({
      doctor: appointment.doctor,
      rated: true
    });

    const total = ratedAppointments.reduce((sum, a) => sum + (a.rating || 0), 0);

    const avgRating =
      ratedAppointments.length > 0
      ? parseFloat((total / ratedAppointments.length).toFixed(2))
      : 0;
    
    await Doctor.findByIdAndUpdate(appointment.doctor, {
      rating: avgRating
    });

    res.json({
      message: "Rating submitted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
