const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");

/* ======================
   GET FILTER OPTIONS
======================== */
exports.getFilterOptions = async (req, res) => {
  try {

    let { specialties } = req.query;

    if (!specialties) specialties = [];

    if (typeof specialties === "string") {
      specialties = [specialties];
    }

    if (
      Array.isArray(specialties) &&
      specialties.length === 1 &&
      specialties[0].includes(",")
    ) {
      specialties = specialties[0].split(",");
    }

    let query = {};

    if (specialties.length) {
      query.specialty = { $in: specialties };
    }

    const doctors = await Doctor.find(query).select("address.area specialty");

    let areas = doctors
      .map(d => d.address?.area)
      .filter(area => area && area.trim() !== "");

    areas = [...new Set(areas.map(a => a.trim()))];

    res.json({ areas });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   PATIENT SEARCH DOCTORS
======================== */
exports.searchDoctors = async (req, res) => {
  try {

    const {
      specialties = [],
      specialty,
      area,
      maxFee,
      rating,
      experience,
      mode,
      gender
    } = req.body;

    let query = {};

    /* SPECIALTY FILTER */

    if (specialty) {
      query.specialty = specialty;
    }
    else if (specialties.length) {
      query.specialty = { $in: specialties };
    }

    /* MODE FILTER */

    if (mode === "online") {
      query.mode = { $in: ["online", "both"] };
    }

    if (mode === "offline") {
      query.mode = { $in: ["offline", "both"] };
    }

    if (mode === "both") {
      query.mode = "both";
    }

    /* GENDER FILTER */

    if (gender) {
      query.gender = gender;
    }

    /* AREA FILTER */

    if (area) {
      query["address.area"] = { $regex: area, $options: "i" };
    }

    /* FEE FILTER */

    if (maxFee) {
      query.consultationFee = { $lte: maxFee };
    }

    /* RATING FILTER */

    if (rating) {
      query.rating = { $gte: rating };
    }

    /* AVAILABILITY FILTER */

    query.$or = [
      { "availability.weekly.monday.0":    { $exists: true } },
      { "availability.weekly.tuesday.0":   { $exists: true } },
      { "availability.weekly.wednesday.0": { $exists: true } },
      { "availability.weekly.thursday.0":  { $exists: true } },
      { "availability.weekly.friday.0":    { $exists: true } },
      { "availability.weekly.saturday.0":  { $exists: true } },
      { "availability.weekly.sunday.0":    { $exists: true } },
      { "availability.overrides.0":        { $exists: true } }
    ];

    const doctors = await Doctor.find(query)
      .select("-password -__v")
      .sort({ rating: -1 });

    res.json({
      count: doctors.length,
      doctors
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   VIEW DOCTOR PROFILE
======================== */
exports.getDoctorProfile = async (req, res) => {
  try {

    const doctor = await Doctor.findById(req.params.id)
      .select("-password -__v");

    if (!doctor) {
      return res.status(404).json({
        error: "Doctor not found"
      });
    }

    res.json(doctor);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   GET DOCTOR REVIEWS
   GET /api/doctors/:id/reviews
======================== */
exports.getDoctorReviews = async (req, res) => {
  try {

    const { id } = req.params;

    // Verify doctor exists
    const doctor = await Doctor.findById(id).select("_id");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const appointments = await Appointment.find({
      doctor: id,
      status: "completed",
      rated: true
    })
      .populate("patient", "name")   // only pull patient name
      .select("rating review createdAt patient")
      .sort({ createdAt: -1 });      // newest first

    const reviews = appointments.map(a => ({
      _id:         a._id,
      rating:      a.rating,
      review:      a.review || "",
      createdAt:   a.createdAt,
      patientName: a.patient?.name || "Patient"
    }));

    res.json(reviews);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   REQUEST APPOINTMENT
======================== */
exports.requestAppointment = async (req, res) => {
  try {

    const patientId = req.user.id || req.user.patientId;

    const { doctorId, date, slotTime } = req.body;

    if (!doctorId || !date || !slotTime) {
      return res.status(400).json({
        error: "doctorId, date and slotTime are required"
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        error: "Doctor not found"
      });
    }

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date,
      slotTime,
      status: "pending"
    });

    res.status(201).json({
      message: "Appointment request sent",
      appointment
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   DOCTOR PROFILE
======================== */
exports.getMyProfile = async (req, res) => {
  try {

    const doctorId = req.user.id || req.user.doctorId;

    const Doctor = await Doctor.findById(doctorId)
      .select("-password -__v");

    if (!doctor) {
      return res.status(404).json({
        error: "Doctor not found"
      });
    }

    res.json(doctor);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   DOCTOR APPOINTMENTS
======================== */
exports.getDoctorAppointments = async (req, res) => {
  try {

    const doctorId = req.user.id || req.user.doctorId;

    const appointments = await Appointment.find({
      doctor: doctorId
    })
      .populate("patient", "name email")
      .sort({ createdAt: -1 });

    res.json({
      count: appointments.length,
      appointments
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};
