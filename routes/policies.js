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
    folder: 'insurance_policies',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage: storage });

// Get all policies (optional ?type= filter)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let result;
    if (type) {
      result = await db.query('SELECT * FROM policies WHERE type = $1 ORDER BY created_at DESC', [type]);
    } else {
      result = await db.query('SELECT * FROM policies ORDER BY created_at DESC');
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching policies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get policy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM policies WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching policy:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new policy
router.post('/', upload.array('images', 50), async (req, res) => {
  try {
    const { name, type, provider, description, cover_amount, pros, cons } = req.body;
    if (!name || !type || !provider) {
      return res.status(400).json({ error: 'Name, type, and provider are required' });
    }

    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const result = await db.query(
      'INSERT INTO policies (name, type, provider, description, cover_amount, pros, cons, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, type, provider, description, cover_amount, pros, cons, JSON.stringify(imageUrls)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating policy:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing policy
router.put('/:id', upload.array('images', 50), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, provider, description, cover_amount, pros, cons } = req.body;
    
    if (!name || !type || !provider) {
      return res.status(400).json({ error: 'Name, type, and provider are required' });
    }

    const newImageUrls = req.files ? req.files.map(file => file.path) : [];
    
    let result;
    if (newImageUrls.length > 0) {
      result = await db.query(
        'UPDATE policies SET name = $1, type = $2, provider = $3, description = $4, cover_amount = $5, pros = $6, cons = $7, images = $8 WHERE id = $9 RETURNING *',
        [name, type, provider, description, cover_amount, pros, cons, JSON.stringify(newImageUrls), id]
      );
    } else {
      result = await db.query(
        'UPDATE policies SET name = $1, type = $2, provider = $3, description = $4, cover_amount = $5, pros = $6, cons = $7 WHERE id = $8 RETURNING *',
        [name, type, provider, description, cover_amount, pros, cons, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating policy:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a policy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM policies WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json({ message: 'Policy deleted successfully' });
  } catch (err) {
    console.error('Error deleting policy:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
