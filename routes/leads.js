const express = require('express');
const router = express.Router();
const db = require('../db');

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
  const { name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker } = req.body;
  if (!name || !phone || !email || !date || !type) {
    return res.status(400).json({ error: 'Core fields (name, phone, email, date, type) are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO leads 
       (name, phone, email, date, type, gender, specific_plan, location, employment_type, annual_income, education, smoker) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, phone, email, date, type, gender, specificPlan, location, employmentType, annualIncome, education, smoker]
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

module.exports = router;
