const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// Helper to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

    await db.query(
      'INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'Your InsuranceShiva Login OTP',
      text: `Your OTP for login is: ${otp}. It is valid for 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const result = await db.query(
      'SELECT * FROM otps WHERE email = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // OTP valid. Upsert user.
    await db.query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Get user's leads/applications
router.get('/:email/leads', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await db.query(
      'SELECT * FROM leads WHERE email = $1 ORDER BY created_at DESC',
      [email]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

module.exports = router;
