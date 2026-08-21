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

const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'insurance_policy_pdfs',
    allowed_formats: ['pdf'],
    resource_type: 'raw'
  }
});

const upload = multer({ storage: storage });
const uploadPdf = multer({ storage: pdfStorage });

// Get all policies (optional ?type= and ?provider= filters)
router.get('/', async (req, res) => {
  try {
    const { type, provider } = req.query;
    let query = 'SELECT * FROM policies';
    const params = [];
    if (type && provider) {
      query += ' WHERE type = $1 AND provider = $2';
      params.push(type, provider);
    } else if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    } else if (provider) {
      query += ' WHERE provider = $1';
      params.push(provider);
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
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
    const { name, type, provider, description, cover_amount, pros, cons, plan_type, insurer_type, policy_link } = req.body;
    if (!name || !type || !provider) {
      return res.status(400).json({ error: 'Name, type, and provider are required' });
    }
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    const result = await db.query(
      'INSERT INTO policies (name, type, provider, description, cover_amount, pros, cons, images, plan_type, insurer_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [name, type, provider, description, cover_amount, pros, cons, JSON.stringify(imageUrls), plan_type || 'Individual', insurer_type || 'Private', policy_link]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating policy:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload PDF for a policy
router.post('/:id/pdf', uploadPdf.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });
    const pdfUrl = req.file.path;
    const result = await db.query(
      'UPDATE policies SET pdf_url = $1 WHERE id = $2 RETURNING *',
      [pdfUrl, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error uploading PDF:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing policy
router.put('/:id', upload.array('images', 50), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, provider, description, cover_amount, pros, cons, plan_type, insurer_type, policy_link } = req.body;
    
    if (!name || !type || !provider) {
      return res.status(400).json({ error: 'Name, type, and provider are required' });
    }

    const newImageUrls = req.files ? req.files.map(file => file.path) : [];
    
    let result;
    if (newImageUrls.length > 0) {
      result = await db.query(
        'UPDATE policies SET name = $1, type = $2, provider = $3, description = $4, cover_amount = $5, pros = $6, cons = $7, images = $8, plan_type = $9, insurer_type = $10 WHERE id = $11 RETURNING *',
        [name, type, provider, description, cover_amount, pros, cons, JSON.stringify(newImageUrls), plan_type || 'Individual', insurer_type || 'Private', policy_link, id]
      );
    } else {
      result = await db.query(
        'UPDATE policies SET name = $1, type = $2, provider = $3, description = $4, cover_amount = $5, pros = $6, cons = $7, plan_type = $8, insurer_type = $9 WHERE id = $10 RETURNING *',
        [name, type, provider, description, cover_amount, pros, cons, plan_type || 'Individual', insurer_type || 'Private', policy_link, id]
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
