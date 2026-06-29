import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Movie Ticket Gateway" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendEmailVerificationOtp = async ({ name, email, otp }) => {
  await sendEmail({
    to: email,
    subject: "Verify Your Movie Ticket Gateway Account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with Movie Ticket Gateway.</p>
        <p>Your email verification OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetOtp = async ({ name, email, otp }) => {
  await sendEmail({
    to: email,
    subject: "Password Reset OTP - Movie Ticket Gateway",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>Your password reset OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please secure your account.</p>
      </div>
    `,
  });
};