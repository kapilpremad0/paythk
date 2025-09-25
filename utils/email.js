// utils/email.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT || 465,
  secure: Number(process.env.MAIL_PORT) === 465, // true if 465, false if 587
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text body
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "No Reply"}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    throw err;
  }
}

module.exports = sendEmail;
