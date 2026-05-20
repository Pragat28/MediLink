const Brevo = require("@getbrevo/brevo");

const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async (to, subject, text) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  
  await apiInstance.sendTransacEmail({
    sender: { name: "Medilink", email: "your-verified-sender@gmail.com" },
    to: [{ email: to }],
    subject,
    textContent: text
  });
};

module.exports = sendEmail;
