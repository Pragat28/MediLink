const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    console.log("Sending email to:", to);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
    
    await transporter.sendMail({
      from: `"Medilink" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    
    console.log("Email sent successfully");
  } catch (err) {
    console.error("EMAIL ERROR:", err.message);
    throw err;
  }
};

module.exports = sendEmail;
