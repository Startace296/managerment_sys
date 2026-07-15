import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export const sendPasswordResetEmail = async (
  to: string,
  resetLink: string
): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Reset your password",
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}">Click here to choose a new password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
};

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Verify your email",
    html: `
      <p>Welcome! Use the code below to verify your email address.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
};
