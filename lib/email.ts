// src/lib/email.ts

import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(
      process.env.SMTP_PORT || 587
    ),
    secure:
      Number(process.env.SMTP_PORT) === 465,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
) {
  await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      process.env.SMTP_USER,

    to: email,

    subject: "Verify your email",

    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Hello ${name}</h2>

        <p>
          Thank you for registering.
          Please verify your email address.
        </p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#000;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Verify Email
          </a>
        </p>

        <p>
          This link expires in 30 minutes.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
) {
  await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      process.env.SMTP_USER,

    to: email,

    subject: "Reset your password",

    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Hello ${name}</h2>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#000;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          This link expires in 30 minutes.
        </p>
      </div>
    `,
  });
}