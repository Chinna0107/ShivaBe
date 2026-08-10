const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all reels
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reels ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reels:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET active reel
router.get('/active', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reels WHERE is_active = true LIMIT 1');
    if (result.rows.length === 0) return res.json(null);
    const reel = result.rows[0];
    const match = reel.url.match(/reel\/([A-Za-z0-9_-]+)/);
    const embed_url = match ? `https://www.instagram.com/reel/${match[1]}/embed/` : reel.url;
    res.json({ ...reel, embed_url });
  } catch (err) {
    console.error('Error fetching active reel:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add reel
router.post('/', async (req, res) => {
  try {
    const { url, label } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    // If no reels exist yet, make this one active
    const count = await db.query('SELECT COUNT(*) FROM reels');
    const is_active = parseInt(count.rows[0].count) === 0;
    const result = await db.query(
      'INSERT INTO reels (url, label, is_active) VALUES ($1, $2, $3) RETURNING *',
      [url, label || null, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding reel:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT activate a reel
router.put('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE reels SET is_active = false');
    const result = await db.query(
      'UPDATE reels SET is_active = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reel not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error activating reel:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a reel
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM reels WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reel not found' });
    // If deleted reel was active, activate the most recent remaining one
    if (result.rows[0].is_active) {
      await db.query('UPDATE reels SET is_active = true WHERE id = (SELECT id FROM reels ORDER BY created_at DESC LIMIT 1)');
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting reel:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
