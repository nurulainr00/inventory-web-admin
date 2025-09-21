import { getFunctions, httpsCallable } from "firebase/functions";

const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// 🔹 Use Firebase environment config to keep credentials safe
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// 🔹 Setup transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// 🔹 Cloud Function to send email
exports.sendMail = functions.https.onCall(async (data, context) => {
  const mailOptions = {
    from: `"Smart Inventory" <${gmailEmail}>`,
    to: data.to,
    subject: data.subject,
    html: data.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
});


