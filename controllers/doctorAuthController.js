const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* 🔥 OTP GENERATOR */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* =================================================
   DOCTOR REGISTER (STEP 1 → SEND OTP)
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

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long"
      });
    }

    if (!phone || !phone.startsWith("+")) {
      return res.status(400).json({
        message: "Phone must include country code"
      });
    }

    let isValidPhone = false;

    if (phone.startsWith("+91")) {
      isValidPhone = /^\+91\d{10}$/.test(phone);
    } else if (phone.startsWith("+1")) {
      isValidPhone = /^\+1\d{10}$/.test(phone);
    } else if (phone.startsWith("+44")) {
      isValidPhone = /^\+44\d{10}$/.test(phone);
    } else if (phone.startsWith("+61")) {
      isValidPhone = /^\+61\d{9}$/.test(phone);
    }

    if (!isValidPhone) {
      return res.status(400).json({
        message: "Invalid phone number for selected country"
      });
    }

    if (
      !name ||
      !phone ||
      !specialty ||
      !consultationFee ||
      !mode ||
      !gender ||
      !registrationNumber ||
      !councilName ||
      !degree
    ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    const existingDoctor = await Doctor.findOne({ email });

    if (existingDoctor) {
      if (existingDoctor.verificationStatus === "rejected") {
        await Doctor.deleteOne({ email });
      } else {
        return res.status(400).json({
          message: "Doctor already exists"
        });
      }
    }

    const photoPath = req.file ? `/uploads/${req.file.filename}` : "";

    /* 🔥 GENERATE OTP */
    const otp = generateOTP();

    const doctor = await Doctor.create({
      name,
      email,
      password,
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

      /* 🔥 OTP STATE */
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      isOtpVerified: false,
      verificationStatus: "otp_pending",

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

    console.log("REGISTER OTP:", otp); // 👉 replace with email later

    res.status(201).json({
      message: "OTP sent to your email",
      email: doctor.email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error in doctor registration",
      error: error.message
    });
  }
};

/* =================================================
   VERIFY OTP (STEP 2 → SEND TO ADMIN)
================================================= */
exports.verifyDoctorOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (doctor.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    doctor.isOtpVerified = true;
    doctor.otp = null;
    doctor.otpExpiry = null;

    /* 🔥 NOW GOES TO ADMIN */
    doctor.verificationStatus = "pending";

    await doctor.save();

    res.json({
      message: "OTP verified. Awaiting admin approval."
    });

  } catch (error) {
    res.status(500).json({
      message: "OTP verification failed"
    });
  }
};

/* =================================================
   DOCTOR LOGIN (STEP 1 → PASSWORD + SEND OTP)
================================================= */
exports.loginDoctor = async (req, res) => {
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
        message: "Password must be at least 6 characters long"
      });
    }

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    if (!doctor.isOtpVerified) {
      return res.status(403).json({
        message: "Please complete registration OTP verification"
      });
    }

    if (doctor.verificationStatus === "rejected") {
      return res.status(403).json({
        message: "Your account has been rejected"
      });
    }

    if (doctor.verificationStatus === "pending") {
      return res.status(403).json({
        message: "Your account is under admin verification"
      });
    }

    /* 🔥 SEND LOGIN OTP */
    const otp = generateOTP();

    doctor.otp = otp;
    doctor.otpExpiry = Date.now() + 5 * 60 * 1000;

    await doctor.save();

    console.log("LOGIN OTP:", otp);

    res.json({
      message: "OTP sent to your email",
      email
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Server error in loginDoctor",
      error: error.message
    });
  }
};

/* =================================================
   VERIFY LOGIN OTP (STEP 2 → FINAL LOGIN)
================================================= */
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (doctor.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    doctor.otp = null;
    doctor.otpExpiry = null;

    await doctor.save();

    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      doctor
    });

  } catch (error) {
    res.status(500).json({
      message: "OTP verification failed"
    });
  }
};