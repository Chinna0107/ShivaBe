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
  params: { folder: 'insurance_gallery', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
});

const upload = multer({ storage });

// GET all gallery items (optional ?category= filter)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM gallery';
    const params = [];
    if (category && category !== 'All') {
      query += ' WHERE category = $1';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching gallery:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST upload gallery images
router.post('/', upload.array('images', 20), async (req, res) => {
  try {
    const { category, caption } = req.body;
    if (!category || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Category and at least one image are required' });
    }
    const inserted = [];
    for (const file of req.files) {
      const result = await db.query(
        'INSERT INTO gallery (image_url, category, caption) VALUES ($1, $2, $3) RETURNING *',
        [file.path, category, caption || null]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    console.error('Error uploading gallery images:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a gallery item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM gallery WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting gallery item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
