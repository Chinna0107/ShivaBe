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
  cloudinary,
  params: { folder: 'insurance_claim_ratios', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
});

const upload = multer({ storage });

// GET all claim ratios
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM claim_ratios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching claim ratios:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new claim ratio
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { category, company, story } = req.body;
    let imageUrl = null;
    
    if (req.file) {
      imageUrl = req.file.path;
    }

    const result = await db.query(
      'INSERT INTO claim_ratios (category, company, story, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [category, company, story, imageUrl]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating claim ratio:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update claim ratio
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, company, story } = req.body;
    
    let query = 'UPDATE claim_ratios SET category = $1, company = $2, story = $3';
    let params = [category, company, story];
    
    if (req.file) {
      query += ', image_url = $4';
      params.push(req.file.path);
      query += ' WHERE id = $5 RETURNING *';
      params.push(id);
    } else {
      query += ' WHERE id = $4 RETURNING *';
      params.push(id);
    }

    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim ratio not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating claim ratio:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE claim ratio
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM claim_ratios WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim ratio not found' });
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting claim ratio:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;