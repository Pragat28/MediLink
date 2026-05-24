const Patient = require("../models/patientModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    // generate patient code
    const generateCode = () =>
      Math.floor(1000 + Math.random() * 9000).toString();

    let code, exists;
    do {
      code = generateCode();
      exists = await Patient.findOne({ patientCode: code });
    } while (exists);

    const hashedPassword = await bcrypt.hash(password, 10);

    const patient = await Patient.create({
      name,
      email,
      password: hashedPassword,
      patientCode: code,
      contactNumber,
      isOtpVerified: true // ✅ mark as verified directly
    });

    const token = jwt.sign(
      { id: patient._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      patient
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
};

/* ================= REMOVE THESE ================= */
// ❌ verifyPatientOtp
// ❌ verifyPatientLoginOtp
// ❌ resendOtp
