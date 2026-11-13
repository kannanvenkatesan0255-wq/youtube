/**
 * Email Service (Password Recovery & Notifications)
 * VidTube Platform Architecture - Phase 2
 */
const nodemailer = require('nodemailer');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');

let transporter = null;

if (config.smtp.isConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
    logger.info(`SMTP Transporter configured with host: ${config.smtp.host}`);
  } catch (error) {
    logger.error('Failed to configure SMTP Transporter:', error.message);
  }
} else {
  logger.info('SMTP service in development mode (reset links will be output to server logs).');
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Unhashed reset token
 * @param {string} name - User's display name
 */
const sendPasswordResetEmail = async (email, resetToken, name = 'Creator') => {
  const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Roboto', -apple-system, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 24px; color: #0f0f0f; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e5e5; padding: 32px; }
        .logo { display: inline-flex; align-items: center; gap: 6px; font-size: 22px; font-weight: bold; color: #0f0f0f; text-decoration: none; }
        .badge { background: #FF0033; color: white; border-radius: 6px; padding: 3px 8px; font-size: 14px; }
        .btn { display: inline-block; background-color: #0f0f0f; color: #ffffff !important; padding: 12px 28px; border-radius: 24px; text-decoration: none; font-weight: 500; font-size: 14px; margin-top: 20px; }
        .footer { margin-top: 32px; font-size: 12px; color: #606060; border-top: 1px solid #eeeeee; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <span class="badge">▶</span> Vid<span>Tube</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; margin-top: 24px; margin-bottom: 12px;">Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #404040;">
          Hi ${name},<br><br>
          We received a request to reset your VidTube account password. Click the button below to choose a new password. This link is single-use and will expire in 15 minutes.
        </p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </p>
        <p style="font-size: 12px; color: #707070; margin-top: 20px;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${resetUrl}" style="color: #065fd4; word-break: break-all;">${resetUrl}</a>
        </p>
        <div class="footer">
          If you did not request this password reset, please ignore this email. Your password will remain unchanged.
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter && config.smtp.isConfigured) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'VidTube — Reset Your Password',
        text: `Hi ${name},\n\nPlease reset your password using this link (expires in 15 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: htmlContent
      });
      logger.success(`Password reset email successfully sent to ${email}`);
      return { sent: true, mode: 'smtp' };
    } catch (error) {
      logger.error(`Failed to send email via SMTP to ${email}:`, error.message);
      // Fallback log
      console.log(`\n[EMAIL FALLBACK] Password Reset URL for ${email}: ${resetUrl}\n`);
      return { sent: false, error: error.message, mode: 'fallback' };
    }
  } else {
    // Development / unconfigured SMTP environment: safely log link for development testing
    console.log('\n===============================================================');
    console.log('   [DEVELOPMENT EMAIL DISPATCH] PASSWORD RESET LINK');
    console.log(`   Recipient: ${email}`);
    console.log(`   Reset URL: ${resetUrl}`);
    console.log('   (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in server/.env for production email delivery)');
    console.log('===============================================================\n');
    return { sent: true, mode: 'development_log', resetUrl };
  }
};

module.exports = {
  sendPasswordResetEmail
};
