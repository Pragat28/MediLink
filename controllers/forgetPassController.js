const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");

const models = {
  doctor: require("../models/doctorModel"),
  patient: require("../models/patientModel")
};

/* 🔥 OTP GENERATOR */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* 🔥 SET OTP */
const setOtp = async (user) => {
  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;
  user.lastOtpSentAt = Date.now();

  await user.save();

  return otp;
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    const Model = models[role];
    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 RATE LIMIT
    if (
      user.lastOtpSentAt &&
      Date.now() - user.lastOtpSentAt < 30000
    ) {
      return res.status(400).json({
        message: "Please wait 30 seconds before requesting another OTP"
      });
    }

    const otp = await setOtp(user);

    await sendEmail(
      email,
      "Reset Password OTP",
      `Your OTP is ${otp}. It will expire in 5 minutes.`
    );

    res.json({
      message: "OTP sent successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to send OTP"
    });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, role } = req.body;

    const Model = models[role];

    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({
      message: "OTP verified"
    });

  } catch (err) {
    res.status(500).json({
      message: "OTP verification failed"
    });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, role } = req.body;

    const Model = models[role];
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // ✅ DO NOT HASH HERE
    user.password = newPassword;

    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to reset password"
    });
  }
};