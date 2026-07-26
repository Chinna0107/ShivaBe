const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all quote requests
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM quote_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new quote request
router.post('/', async (req, res) => {
  try {
    const { age, cover_amount, gender, phone, policy_name } = req.body;
    
    if (!age || !cover_amount || !gender || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      'INSERT INTO quote_requests (age, cover_amount, gender, phone, policy_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [age, cover_amount, gender, phone, policy_name || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await db.query(
      'UPDATE quote_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote request not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
