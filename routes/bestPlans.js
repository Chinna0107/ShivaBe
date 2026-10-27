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
    const { category, rank, name, company_name, badge, premium, cover, claim_ratio, highlight, plan_type, insurer_type } = req.body;
    
    // Basic validation
    if (!category || !rank || !name || !company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Category, rank, company name, and product name are required' });
    }

    const result = await db.query(
      `INSERT INTO best_plans 
        (category, rank, name, company_name, badge, premium, cover, claim_ratio, highlight, plan_type, insurer_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [category, rank, name, company_name.trim(), badge, premium, cover, claim_ratio, highlight, plan_type || 'Individual/Multi Individual', insurer_type || 'Private']
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
    const { category, rank, name, company_name, badge, premium, cover, claim_ratio, highlight, plan_type, insurer_type } = req.body;

    if (!category || !rank || !name || !company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Category, rank, company name, and product name are required' });
    }

    const result = await db.query(
      `UPDATE best_plans 
       SET category = $1, rank = $2, name = $3, company_name = $4, badge = $5, premium = $6, cover = $7, claim_ratio = $8, highlight = $9, plan_type = $10, insurer_type = $11
       WHERE id = $12
       RETURNING *`,
      [category, rank, name, company_name.trim(), badge, premium, cover, claim_ratio, highlight, plan_type, insurer_type, id]
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
