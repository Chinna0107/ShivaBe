const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'insurance_policy_docs',
    allowed_formats: ['pdf'],
    resource_type: 'raw'
  }
});

const upload = multer({ storage: storage });

// GET /api/leads/check?phone=
router.get('/check', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'phone is required' });
  try {
    const result = await db.query('SELECT id FROM leads WHERE phone = $1 LIMIT 1', [phone]);
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking lead:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads?type=health
router.get('/', async (req, res) => {
  const { type } = req.query;
  try {
    let query = 'SELECT * FROM leads ORDER BY created_at DESC';
    let params = [];
    if (type) {
      query = 'SELECT * FROM leads WHERE type = $1 ORDER BY created_at DESC';
      params = [type];
    }
    const result = await db.query(query, params);
    // Format dates to string "YYYY-MM-DD" for frontend compatibility if needed, though PG DATE handles it mostly
    const leads = result.rows.map(row => ({
      ...row,
      date: new Date(row.date).toISOString().split('T')[0]
    }));
    res.json(leads);
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  const { name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker, members, vehicleNumber, vehicleType, vehicleManufacturer, vehicleModel, vehicleFuelType, vehicleCondition, vehicleRegDate, vehiclePincode } = req.body;
  if (!name || !phone || !email || !date || !type) {
    return res.status(400).json({ error: 'Core fields (name, phone, email, date, type) are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO leads 
       (name, phone, email, date, type, gender, specific_plan, location, employment_type, annual_income, education, smoker, members, vehicle_number, vehicle_type, vehicle_manufacturer, vehicle_model, vehicle_fuel_type, vehicle_condition, vehicle_reg_date, vehicle_pincode) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
      [name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker, Array.isArray(members) ? members.join(', ') : members, vehicleNumber || null, vehicleType || null, vehicleManufacturer || null, vehicleModel || null, vehicleFuelType || null, vehicleCondition || null, vehicleRegDate || null, vehiclePincode || null]
    );
    
    // Emit real-time event to dashboards
    const newLead = result.rows[0];
    const io = req.app.get('io');
    if (io) {
      io.emit('new-lead', newLead);
    }
    
    res.status(201).json(newLead);
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/leads/:id/status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['Pending', 'Agreed', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await db.query(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating lead status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/document
router.post('/:id/document', upload.single('document'), async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No document uploaded' });
  }

  try {
    const documentUrl = req.file.path;
    const result = await db.query(
      'UPDATE leads SET policy_document_url = $1 WHERE id = $2 RETURNING *',
      [documentUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
