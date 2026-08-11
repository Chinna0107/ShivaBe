const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');
const path = require('path');

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
    subject: 'Your InsuranceShiva Verification OTP',
    text: `Your OTP for verification is: ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="display: flex; flex-wrap: wrap; border-bottom: 3px solid #0d6efd;">
            <div style="padding: 20px; flex: 1 1 200px; text-align: center; background-color: #ffffff; display: flex; align-items: center; justify-content: center;">
              <img src="cid:logo" alt="InsuranceShiva" style="max-width: 140px; height: auto;" />
            </div>
            <div style="padding: 20px; flex: 1 1 250px; background-color: #0d6efd; color: #ffffff; text-align: center; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">&#128274; Secure &bull; Reliable &bull; Trusted</div>
            </div>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px 20px;">
            <h2 style="margin-top: 0; color: #0d6efd; font-size: 22px;">Hello,</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 25px;">
              Thank you for choosing <strong style="color: #0d6efd;">InsuranceShiva</strong>. Use the OTP below to verify your email address.
            </p>
            
            <!-- OTP Box -->
            <div style="border: 2px solid #e5edff; border-radius: 8px; padding: 25px 15px; text-align: center; margin-bottom: 25px; background-color: #f8faff;">
              <div style="font-size: 13px; font-weight: bold; color: #0d6efd; letter-spacing: 1px; margin-bottom: 15px; text-transform: uppercase;">
                Your OTP Code
              </div>
              <div style="font-size: 38px; font-weight: bold; color: #0d6efd; letter-spacing: 5px; margin-bottom: 15px; word-break: break-all;">
                ${otp}
              </div>
              <div style="font-size: 13px; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 6px;">
                &#128336; This OTP is valid for <strong style="color: #0d6efd;">10 minutes</strong>.
              </div>
            </div>
            
            <!-- Warning Box -->
            <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 8px; padding: 15px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 30px;">
              <div style="background-color: #ffe4e6; color: #e11d48; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px;">
                &#128274;
              </div>
              <div>
                <div style="font-size: 13px; font-weight: bold; color: #1f2937; margin-bottom: 4px;">
                  For your security, do not share this OTP with anyone.
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                  If you did not request this, please ignore this email.
                </div>
              </div>
            </div>
            
            <!-- Footer with Social Icons -->
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 20px; gap: 15px;">
              <div>
                <div style="font-size: 14px; color: #0d6efd; font-weight: bold;">Thanks,</div>
                <div style="font-size: 13px; color: #4b5563;">InsuranceShiva Team</div>
              </div>
              <div style="display: flex; gap: 10px;">
                <a href="https://instagram.com/insuranceshiva" style="text-decoration: none; display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; border: 1px solid #0d6efd; color: #0d6efd; font-weight: bold; font-size: 13px; background-color: #f8faff;">i</a>
                <a href="https://facebook.com/insuranceshiva" style="text-decoration: none; display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; border: 1px solid #0d6efd; color: #0d6efd; font-weight: bold; font-size: 15px; background-color: #f8faff;">f</a>
                <a href="https://linkedin.com/company/insuranceshiva" style="text-decoration: none; display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; border: 1px solid #0d6efd; color: #0d6efd; font-weight: bold; font-size: 13px; background-color: #f8faff;">in</a>
                <a href="mailto:support@insuranceshiva.com" style="text-decoration: none; display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; border: 1px solid #0d6efd; color: #0d6efd; font-size: 16px; background-color: #f8faff;">&#9993;</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    attachments: [{
      filename: 'logo.png',
      path: path.join(__dirname, '../public/images/logo.png'),
      cid: 'logo'
    }]
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

// Direct submit (no OTP)
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, preferredTime, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
    const result = await db.query(
      'INSERT INTO call_requests (name, phone, email, preferred_time, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email || null, preferredTime || 'Anytime', notes || null]
    );
    const io = req.app.get('io');
    if (io) io.emit('new-call-request', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating call request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all call requests (Admin/Employee)
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

// Update reminder
router.put('/:id/reminder', async (req, res) => {
  try {
    const { id } = req.params;
    const { reminder } = req.body;
    
    const result = await db.query(
      'UPDATE call_requests SET reminder = $1 WHERE id = $2 RETURNING *',
      [reminder, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Call request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating call request reminder:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
