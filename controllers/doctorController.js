const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* =================================================
   DOCTOR REGISTER (NO OTP → ADMIN APPROVAL)
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

    const doctor = await Doctor.create({
      name,
      email,
      password: hashedPassword,
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

      // ✅ IMPORTANT: direct to admin approval
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
      message: "Registration successful. Await admin approval.",
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
   LOGIN (NO OTP)
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

    // ✅ ADMIN APPROVAL CHECK
    if (doctor.verificationStatus !== "approved") {
      return res.status(403).json({
        message: "Account not approved yet"
      });
    }

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
      message: "Server error in loginDoctor"
    });
  }
};
