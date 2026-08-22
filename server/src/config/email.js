const axios = require('axios');

const RESEND_API_URL = 'https://api.resend.com/emails';

const sendEmail = async ({ to, subject, html }) => {
  await axios.post(
    RESEND_API_URL,
    {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

module.exports = sendEmail;
