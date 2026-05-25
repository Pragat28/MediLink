const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* =================================================
   DOCTOR REGISTER
================================================= */
exports.registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialty,
      consultationFee,
      mode,
      street,
      area,
      gender,
      about,
      registrationNumber,
      councilName,
      degree
    } = req.body;

    // ── Validations ──
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    if (!phone || !phone.startsWith("+")) {
      return res.status(400).json({ message: "Phone must include country code" });
    }

    // ── Duplicate check ──
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      if (existingDoctor.verificationStatus === "rejected") {
        await Doctor.deleteOne({ email });
      } else {
        return res.status(400).json({ message: "Doctor already exists" });
      }
    }

    // ── Create doctor (pre-save hook handles hashing) ──
    const photoPath = req.file ? `/uploads/${req.file.filename}` : "";

    const doctor = await Doctor.create({
      name,
      email,
      password,          // ✅ plain text — pre-save hook hashes it once
      phone,
      specialty,
      consultationFee,
      mode,
      gender,
      about,
      photo: photoPath,
      verificationDetails: {
        registrationNumber,
        councilName,
        degree
      },
      verificationStatus: "pending",
      isVerified: false,
      address: {
        street: street || "",
        area: area || "",
        city: ""
      },
      availability: {
        weekly: {},
        overrides: []
      }
    });

    res.status(201).json({
      message: "Registration submitted. Await admin approval.",
      email: doctor.email
    });

  } catch (error) {
    console.error("registerDoctor error:", error);
    res.status(500).json({ message: "Error in doctor registration" });
  }
};

/* =================================================
   DOCTOR LOGIN
================================================= */
exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // ── Find doctor ──
    const doctor = await Doctor.findOne({ email: email.trim().toLowerCase() });
    if (!doctor) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ── Check password ──
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ── Check approval status ──
    if (doctor.verificationStatus === "pending") {
      return res.status(403).json({ message: "Account not approved yet" });
    }
    if (doctor.verificationStatus === "rejected") {
      return res.status(403).json({ message: "Your account has been rejected. Please contact support." });
    }

    // ── Generate token ──
    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ── Strip password from response ──
    const doctorData = doctor.toObject();
    delete doctorData.password;

    res.status(200).json({
      message: "Login successful",
      token,
      doctor: doctorData
    });

  } catch (error) {
    console.error("loginDoctor error:", error);
    res.status(500).json({ message: "Server error in loginDoctor" });
  }
};
