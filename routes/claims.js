const express = require('express');
const router = express.Router();
const db = require('../db');

// POST a new claim request
router.post('/', async (req, res) => {
  // Accept both camelCase (legacy) and snake_case (new form)
  const policyNumber  = req.body.policy_number   || req.body.policyNumber;
  const registeredName = req.body.registered_name || req.body.registeredName;
  const mobileNumber  = req.body.mobile_number   || req.body.mobileNumber;
  const emailId       = req.body.email_id        || req.body.emailId;
  const claimIssue    = req.body.claim_issue      || req.body.claimIssue;
  const planType      = req.body.plan_type        || req.body.planType;
  try {
    const result = await db.query(
      `INSERT INTO claim_requests 
      (policy_number, registered_name, mobile_number, email_id, claim_issue, plan_type) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [policyNumber, registeredName, mobileNumber, emailId, claimIssue, planType]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating claim request:', error);
    res.status(500).json({ error: 'Failed to create claim request' });
  }
});

// GET all claim requests
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM claim_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching claim requests:', error);
    res.status(500).json({ error: 'Failed to fetch claim requests' });
  }
});

// PUT update claim status
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await db.query(
      'UPDATE claim_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating claim request:', error);
    res.status(500).json({ error: 'Failed to update claim request' });
  }
});

// DELETE a claim request
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM claim_requests WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim request not found' });
    }
    res.json({ message: 'Claim request deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim request:', error);
    res.status(500).json({ error: 'Failed to delete claim request' });
  }
});

module.exports = router;
