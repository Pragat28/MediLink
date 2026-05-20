const SibApiV3Sdk = require("@getbrevo/brevo");

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const sendEmail = async (to, subject, text) => {
  await apiInstance.sendTransacEmail({
    sender: { name: "MediLink", email: "medilink.verify@gmail.com" },
    to: [{ email: to }],
    subject,
    textContent: text
  });
};

module.exports = sendEmail;
