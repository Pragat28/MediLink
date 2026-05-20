const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  await resend.emails.send({
    from: "Medilink <onboarding@resend.dev>", // use this until you verify a domain
    to,
    subject,
    text
  });
};

module.exports = sendEmail;
