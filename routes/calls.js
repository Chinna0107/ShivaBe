const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Setup nodemailer transporter
// In production, configure these in .env
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email provider
  auth: {
    user: process.env.SMTP_EMAIL || 'dummy@example.com',
    pass: process.env.SMTP_PASSWORD || 'dummy_password'
  }
});

// Helper to send OTP email
const sendOTPEmail = async (email, otp) => {
  // If SMTP is not configured, just log it for dev purposes
  if (!process.env.SMTP_EMAIL) {
    console.log(`[DEV MODE] SMTP not configured. OTP for ${email} is: ${otp}`);
    return true;
  }

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'InsuranceShiva - Your Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify your email address</h2>
        <p>Thank you for requesting a call with an InsuranceShiva expert.</p>
        <p>Your OTP for verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// 1. Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    // Clean up old OTPs for this email
    await db.query('DELETE FROM otps WHERE email = $1', [email]);
    
    // Save new OTP
    await db.query(
      'INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Send email
    const sent = await sendOTPEmail(email, otp);
    if (!sent && process.env.SMTP_EMAIL) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error in request-otp:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Verify OTP and Create Call Request
router.post('/verify', async (req, res) => {
  try {
    const { email, otp, name, phone, preferredTime } = req.body;
    
    if (!email || !otp || !name || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify OTP
    const otpResult = await db.query(
      'SELECT * FROM otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // OTP is valid, delete it
    await db.query('DELETE FROM otps WHERE email = $1', [email]);

    // Create call request
    const result = await db.query(
      `INSERT INTO call_requests (name, phone, email, preferred_time) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone, email, preferredTime || 'Anytime']
    );

    const newRequest = result.rows[0];

    // Emit real-time event to dashboards
    const io = req.app.get('io');
    if (io) {
      io.emit('new-call-request', newRequest);
    }

    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Error in verify-otp:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get all call requests (Admin/Employee)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM call_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching call requests:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Update status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await db.query(
      'UPDATE call_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating call request status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
