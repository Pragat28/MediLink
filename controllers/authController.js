const Patient = require("../models/patientModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* 🔥 OTP GENERATOR */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* ================= REGISTER (STEP 1 → SEND OTP) ================= */
exports.registerPatient = async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    if (!contactNumber || !contactNumber.startsWith("+")) {
      return res.status(400).json({
        message: "Phone must include country code"
      });
    }

    let isValidPhone = false;

    if (contactNumber.startsWith("+91")) {
      isValidPhone = /^\+91\d{10}$/.test(contactNumber);
    } else if (contactNumber.startsWith("+1")) {
      isValidPhone = /^\+1\d{10}$/.test(contactNumber);
    } else if (contactNumber.startsWith("+44")) {
      isValidPhone = /^\+44\d{10}$/.test(contactNumber);
    } else if (contactNumber.startsWith("+61")) {
      isValidPhone = /^\+61\d{9}$/.test(contactNumber);
    }

    if (!isValidPhone) {
      return res.status(400).json({
        message: "Invalid phone number for selected country"
      });
    }

    const exist = await Patient.findOne({ email });
    if (exist) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    /* 🔥 GENERATE UNIQUE PATIENT CODE */
    const generateCode = () =>
      Math.floor(1000 + Math.random() * 9000).toString();

    let code, exists;

    do {
      code = generateCode();
      exists = await Patient.findOne({ patientCode: code });
    } while (exists);

    /* 🔥 GENERATE OTP */
    const otp = generateOTP();

    const patient = await Patient.create({
      name,
      email,
      password: hashed,
      patientCode: code,
      contactNumber,

      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      isOtpVerified: false
    });

    console.log("PATIENT REGISTER OTP:", otp);

    res.status(201).json({
      message: "OTP sent to your email",
      email
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= VERIFY REGISTER OTP ================= */
exports.verifyPatientOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (patient.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    patient.isOtpVerified = true;
    patient.otp = null;
    patient.otpExpiry = null;

    await patient.save();

    res.json({
      message: "Registration successful"
    });

  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/* ================= LOGIN (STEP 1 → PASSWORD + OTP) ================= */
exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(400).json({
        message: "Email not registered"
      });
    }

    const isMatch = await bcrypt.compare(password, patient.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password"
      });
    }

    if (!patient.isOtpVerified) {
      return res.status(403).json({
        message: "Please verify your email first"
      });
    }

    /* 🔥 SEND LOGIN OTP */
    const otp = generateOTP();

    patient.otp = otp;
    patient.otpExpiry = Date.now() + 5 * 60 * 1000;

    await patient.save();

    console.log("PATIENT LOGIN OTP:", otp);

    res.json({
      message: "OTP sent to your email",
      email
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= VERIFY LOGIN OTP ================= */
exports.verifyPatientLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (patient.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    patient.otp = null;
    patient.otpExpiry = null;

    await patient.save();

    const token = jwt.sign(
      { id: patient._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      patient
    });

  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/* ================= OPTIONAL ================= */
exports.registerUser = async (req, res) => {
  res.json({ message: "User registered successfully" });
};

exports.loginUser = async (req, res) => {
  res.json({ message: "User logged in successfully" });
};