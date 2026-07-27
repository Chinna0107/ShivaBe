const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const otp = "123456";

const mailOptions = {
  from: process.env.SMTP_EMAIL,
  to: process.env.SMTP_EMAIL, 
  subject: 'Test HTML Email 2',
  text: `Your OTP for login is: ${otp}. It is valid for 10 minutes.`,
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="display: flex; background: linear-gradient(to right, #ffffff 30%, #0d6efd 30%);">
          <div style="padding: 20px; width: 30%; background-color: #ffffff;">
            <img src="cid:logo" alt="InsuranceShiva" style="max-width: 120px; height: auto;" />
          </div>
          <div style="padding: 20px; width: 70%; background-color: #0d6efd; color: #ffffff; text-align: right; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">&#128274; Secure &bull; Reliable &bull; Trusted</div>
            <div style="font-size: 12px; opacity: 0.9;">Your Security is Our Priority</div>
          </div>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px;">
          <h2 style="margin-top: 0; color: #0d6efd; font-size: 24px;">Hello,</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4b5563; margin-bottom: 30px;">
            Thank you for choosing <strong style="color: #0d6efd;">InsuranceShiva</strong>. Use the OTP below to securely log in to your account.
          </p>
          
          <!-- OTP Box -->
          <div style="border: 2px solid #e5edff; border-radius: 8px; padding: 30px 20px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: #0d6efd; letter-spacing: 1px; margin-bottom: 15px; text-transform: uppercase;">
              Your OTP Code
            </div>
            <div style="font-size: 48px; font-weight: bold; color: #0d6efd; letter-spacing: 8px; margin-bottom: 20px;">
              ${otp}
            </div>
            <div style="font-size: 14px; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 6px;">
              &#128336; This OTP is valid for <strong style="color: #0d6efd;">10 minutes</strong>.
            </div>
          </div>
          
          <!-- Warning Box -->
          <div style="background-color: #f8faff; border: 1px solid #e5edff; border-radius: 8px; padding: 15px 20px; display: flex; align-items: flex-start; gap: 15px; margin-bottom: 30px;">
            <div style="background-color: #e5edff; color: #0d6efd; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px;">
              &#128274;
            </div>
            <div>
              <div style="font-size: 14px; font-weight: bold; color: #1f2937; margin-bottom: 4px;">
                For your security, do not share this OTP with anyone.
              </div>
              <div style="font-size: 13px; color: #6b7280;">
                If you did not request this, please ignore this email.
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 20px;">
            <div>
              <div style="font-size: 14px; color: #0d6efd; font-weight: bold;">Thanks,</div>
              <div style="font-size: 14px; color: #4b5563;">InsuranceShiva Team</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  attachments: [{
    filename: 'logo.png',
    path: path.join(__dirname, 'public/images/logo.png'),
    cid: 'logo'
  }]
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) console.error('Error:', err);
  else console.log('Sent:', info.response);
});
