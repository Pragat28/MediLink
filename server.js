const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();

const app = express();

/* ================= DATABASE ================= */

connectDB();

/* ================= MIDDLEWARE ================= */

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://medi-link-frontend-beta.vercel.app", // your production Vercel URL
  ],
  credentials: true,
}));

app.use(express.json());

/* SERVE UPLOADED FILES */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */

// Patient auth
app.use("/api/auth", require("./routes/authRoutes"));

// Doctor auth
app.use("/api/doctor-auth", require("./routes/doctorAuthRoutes"));

app.use("/api/forgot-password", require("./routes/forgotPassRoutes"));

// Doctor list / search
app.use("/api/doctors", require("./routes/doctorRoutes"));

// 🔵 PATIENT PROFILE ROUTES (ADD THIS)
app.use("/api/patient", require("./routes/patientRoutes"));

// Prediction
app.use("/api", require("./routes/predictionRoutes"));

// Doctor profile
app.use("/api/doctor-profile", require("./routes/doctorProfileRoutes"));

// Appointments
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/doctor-appointments", require("./routes/doctorAppointmentRoutes"));


app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/test-email", async (req, res) => {
  try {
    const sendEmail = require("./utils/sendEmail");
    await sendEmail("medilink.verify@gmail.com", "Test", "Hello from Render");
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

/* ================= ROOT ================= */

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

/* ================= SERVER ================= */

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
