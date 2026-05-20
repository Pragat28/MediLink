const axios = require("axios");

const sendEmail = async (to, subject, text) => {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "MediLink", email: "medilink.verify@gmail.com" },
      to: [{ email: to }],
      subject,
      textContent: text
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );
};

module.exports = sendEmail;
