import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (err) {
    logger.error('Failed to send email', err);
  }
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B1220; color: #F4F7FB; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 0 auto; padding: 40px 24px; }
          .logo { text-align: center; margin-bottom: 32px; }
          .logo img { width: 64px; height: 64px; }
          h1 { font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #F4F7FB; }
          p { font-size: 15px; line-height: 1.6; color: #9BB0D0; margin: 0 0 24px; }
          .btn { display: block; width: 100%; padding: 14px; background: #2DD4BF; color: #0B1220; text-align: center; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
          .footer { margin-top: 32px; text-align: center; font-size: 13px; color: #6B84A8; }
          .token-box { background: #162233; border: 1px solid #243247; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px; font-family: monospace; font-size: 14px; color: #2DD4BF; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="cid:logo" alt="My Store" />
          </div>
          <h1>Reset your password</h1>
          <p>You requested a password reset for your My Store account. Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" class="btn">Reset Password</a>
          <p style="margin-top: 24px; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <div class="token-box">${resetUrl}</div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <div class="footer">My Store &mdash; Repair Desk</div>
        </div>
      </body>
      </html>
    `,
  };
}
