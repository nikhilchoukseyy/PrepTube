import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail transporter error:", error.message);
  } else {
    console.log("✅ Mail server is ready");
  }
});

export const sendWelcomeEmail = async (toEmail, name) => {
  const mailOptions = {
    from: `"PrepTube" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to PrepTube! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Hey ${name}, Welcome to PrepTube! 👋</h2>
        <p>Your account has been created successfully.</p>
        <p>Start learning smarter with YouTube playlists. 🚀</p>
        <br/>
        <p>— PrepTube Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


export const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"PrepTube" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset Your PrepTube Password 🔑",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password.</p>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
        <a href="${resetURL}" 
           style="display:inline-block; padding:12px 24px; background:#4F46E5; 
                  color:white; border-radius:6px; text-decoration:none; margin-top:16px;">
          Reset Password
        </a>
        <p style="margin-top:20px; color:#888; font-size:12px;">
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};