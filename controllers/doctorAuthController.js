const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
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

/* =================================================
   DOCTOR REGISTER (SEND OTP)
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

    const existingDoctor = await Doctor.findOne({ email });

    if (existingDoctor) {
      if (!existingDoctor.isOtpVerified) {
        const otp = await setOtp(existingDoctor);

        await sendEmail(
          email,
          "Doctor Registration OTP",
          `Your OTP is ${otp}. It will expire in 5 minutes.`
        );

        return res.status(200).json({
          message: "OTP resent to your email",
          email
        });
      }

      if (existingDoctor.verificationStatus === "rejected") {
        await Doctor.deleteOne({ email });
      } else {
        return res.status(400).json({
          message: "Doctor already exists"
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const photoPath = req.file ? `/uploads/${req.file.filename}` : "";

    const otp = generateOTP();

    const doctor = await Doctor.create({
      name,
      email,
      password: hashedPassword, // ✅ FIXED
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

      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      lastOtpSentAt: Date.now(),

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

    await sendEmail(
      email,
      "Doctor Registration OTP",
      `Your OTP is ${otp}. It will expire in 5 minutes.`
    );

    res.status(201).json({
      message: "OTP sent to your email",
      email: doctor.email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error in doctor registration"
    });
  }
};

/* =================================================
   VERIFY REGISTER OTP
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

    // 🔥 IMPORTANT STATUS CHANGE
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
   LOGIN (SEND OTP)
================================================= */
exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!doctor.isOtpVerified) {
      return res.status(403).json({
        message: "Please verify your email first"
      });
    }

    if (doctor.verificationStatus !== "approved") {
      return res.status(403).json({
        message: "Account not approved yet"
      });
    }

    if (
      doctor.lastOtpSentAt &&
      Date.now() - doctor.lastOtpSentAt < 30000
    ) {
      return res.status(400).json({
        message: "Please wait 30 seconds before requesting another OTP"
      });
    }

    const otp = await setOtp(doctor);

    await sendEmail(
      email,
      "Doctor Login OTP",
      `Your login OTP is ${otp}`
    );

    res.json({
      message: "OTP sent to your email",
      email
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error in loginDoctor"
    });
  }
};

/* =================================================
   VERIFY LOGIN OTP (🔥 CRITICAL FIX HERE)
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

    // 🔥🔥🔥 MAIN FIX (NO BYPASS)
    if (doctor.verificationStatus !== "approved") {
      return res.status(403).json({
        message: "Admin has not approved your account yet"
      });
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

/* =================================================
   RESEND OTP
================================================= */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (
      doctor.lastOtpSentAt &&
      Date.now() - doctor.lastOtpSentAt < 30000
    ) {
      return res.status(400).json({
        message: "Please wait 30 seconds before requesting another OTP"
      });
    }

    const otp = await setOtp(doctor);

    await sendEmail(
      email,
      "Doctor OTP Resent",
      `Your new OTP is ${otp}. It will expire in 5 minutes.`
    );

    res.json({
      message: "OTP resent successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to resend OTP"
    });
  }
};