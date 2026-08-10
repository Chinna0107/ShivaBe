const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all jobs (optional ?active=true filter)
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    let query = 'SELECT * FROM careers';
    const params = [];
    if (active === 'true') {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching careers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single job
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM careers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create job
router.post('/', async (req, res) => {
  try {
    const { title, department, location, type, experience, description, requirements, is_active } = req.body;
    if (!title || !location) return res.status(400).json({ error: 'Title and location are required' });
    const result = await db.query(
      `INSERT INTO careers (title, department, location, type, experience, description, requirements, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, department || 'General', location, type || 'Full-time', experience || '', description || '', requirements || '', is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update job
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, location, type, experience, description, requirements, is_active } = req.body;
    const result = await db.query(
      `UPDATE careers SET title=$1, department=$2, location=$3, type=$4, experience=$5,
       description=$6, requirements=$7, is_active=$8 WHERE id=$9 RETURNING *`,
      [title, department, location, type, experience, description, requirements, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE job
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM careers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST apply for a job
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'Name, email and phone are required' });
    const result = await db.query(
      `INSERT INTO career_applications (job_id, name, email, phone, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, name, email, phone, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
