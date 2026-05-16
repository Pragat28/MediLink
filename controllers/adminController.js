const Admin = require("../models/adminModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= ADMIN LOGIN ================= */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server error during admin login",
      error: error.message
    });
  }
};

/* ================= GET PENDING DOCTORS ================= */
exports.getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      verificationStatus: "pending"
    }).select("-password");

    res.json(doctors);

  } catch (error) {
    console.error("FETCH PENDING DOCTORS ERROR:", error);

    res.status(500).json({
      message: "Error fetching doctors",
      error: error.message
    });
  }
};

/* ================= VERIFY DOCTOR ================= */
exports.verifyDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    doctor.isVerified = true;
    doctor.verificationStatus = "approved";

    await doctor.save();

    res.json({
      message: "Doctor verified successfully"
    });

  } catch (error) {
    console.error("VERIFY DOCTOR ERROR:", error);

    res.status(500).json({
      message: "Error verifying doctor",
      error: error.message
    });
  }
};

/* ================= REJECT DOCTOR ================= */
exports.rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    doctor.isVerified = false;
    doctor.verificationStatus = "rejected";

    await doctor.save();

    res.json({
      message: "Doctor rejected successfully"
    });

  } catch (error) {
    console.error("REJECT DOCTOR ERROR:", error);

    res.status(500).json({
      message: "Error rejecting doctor",
      error: error.message
    });
  }
};