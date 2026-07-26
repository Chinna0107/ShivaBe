const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all best plans, optionally filtered by category, ordered by category and rank
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM best_plans';
    let params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, rank ASC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new best plan
router.post('/', async (req, res) => {
  try {
    const { category, rank, name, badge, premium, cover, claim_ratio, highlight } = req.body;
    
    // Basic validation
    if (!category || !rank || !name) {
      return res.status(400).json({ error: 'Category, rank, and name are required' });
    }

    const result = await db.query(
      `INSERT INTO best_plans 
        (category, rank, name, badge, premium, cover, claim_ratio, highlight) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [category, rank, name, badge, premium, cover, claim_ratio, highlight]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update an existing best plan
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, rank, name, badge, premium, cover, claim_ratio, highlight } = req.body;

    const result = await db.query(
      `UPDATE best_plans 
       SET category = $1, rank = $2, name = $3, badge = $4, premium = $5, cover = $6, claim_ratio = $7, highlight = $8
       WHERE id = $9 
       RETURNING *`,
      [category, rank, name, badge, premium, cover, claim_ratio, highlight, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Best plan not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a best plan
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM best_plans WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Best plan not found' });
    }
    
    res.json({ message: 'Best plan deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
