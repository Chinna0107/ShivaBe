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

const mailOptions = {
  from: process.env.SMTP_EMAIL,
  to: process.env.SMTP_EMAIL, // Send to self
  subject: 'Test HTML Email',
  text: 'Plain text fallback.',
  html: '<h1>Hello World!</h1><img src="cid:logo" />',
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
