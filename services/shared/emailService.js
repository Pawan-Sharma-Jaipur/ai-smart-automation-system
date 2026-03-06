const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('./database');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendPasswordReset(email, resetToken) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@aiautomation.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  async sendVerificationEmail(email, verificationToken) {
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@aiautomation.com',
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h2>Email Verification</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }
}

// Password reset functions
async function requestPasswordReset(email) {
  const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  
  if (users.length === 0) {
    return { success: false, error: 'Email not found' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await db.execute(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [users[0].id, resetToken, expiresAt]
  );

  const emailService = new EmailService();
  await emailService.sendPasswordReset(email, resetToken);

  return { success: true, message: 'Password reset email sent' };
}

async function resetPassword(token, newPassword) {
  const [resets] = await db.execute(
    'SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = 0',
    [token]
  );

  if (resets.length === 0) {
    return { success: false, error: 'Invalid or expired token' };
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resets[0].user_id]);
  await db.execute('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);

  return { success: true, message: 'Password reset successful' };
}

module.exports = {
  EmailService,
  requestPasswordReset,
  resetPassword
};
