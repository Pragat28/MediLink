const Patient = require("../models/patientModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

/* 🔥 OTP GENERATOR */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* 🔥 REUSABLE OTP SETTER */
const setOtp = async (user) => {
  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;
  user.lastOtpSentAt = Date.now();

  await user.save();

  return otp;
};

/* ================= REGISTER ================= */
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

    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
      if (!existingPatient.isOtpVerified) {
        const otp = await setOtp(existingPatient);

        await sendEmail(
          email,
          "Patient Registration OTP",
          `Your OTP is ${otp}. It will expire in 5 minutes.`
        );

        return res.status(200).json({
          message: "OTP resent to your email",
          email
        });
      }

      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const generateCode = () =>
      Math.floor(1000 + Math.random() * 9000).toString();

    let code, exists;

    do {
      code = generateCode();
      exists = await Patient.findOne({ patientCode: code });
    } while (exists);

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    await Patient.create({
      name,
      email,
      password: hashedPassword,
      patientCode: code,
      contactNumber,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      lastOtpSentAt: Date.now(),
      isOtpVerified: false
    });

    await sendEmail(
      email,
      "Patient Registration OTP",
      `Your OTP is ${otp}. It will expire in 5 minutes.`
    );

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

    const token = jwt.sign(
      { id: patient._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Registration successful",
      token,
      patient
    });

  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/* ================= LOGIN ================= */
exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

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

    const otp = await setOtp(patient);

    await sendEmail(
      email,
      "Patient Login OTP",
      `Your login OTP is ${otp}`
    );

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

/* ================= RESEND OTP ================= */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const otp = await setOtp(patient);

    await sendEmail(
      email,
      "Patient OTP Resent",
      `Your new OTP is ${otp}. It will expire in 5 minutes.`
    );

    res.json({
      message: "OTP resent successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to resend OTP"
    });
  }
};