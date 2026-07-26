const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees
router.post('/', async (req, res) => {
  const { name, email, role, department, password } = req.body;
  if (!name || !email || !role || !department || !password) {
    return res.status(400).json({ error: 'All fields (including password) are required' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const result = await db.query(
      'INSERT INTO employees (name, email, role, department, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, role, department, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, department, password } = req.body;
  try {
    let result;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      result = await db.query(
        'UPDATE employees SET name = $1, email = $2, role = $3, department = $4, password_hash = $5 WHERE id = $6 RETURNING *',
        [name, email, role, department, hash, id]
      );
    } else {
      result = await db.query(
        'UPDATE employees SET name = $1, email = $2, role = $3, department = $4 WHERE id = $5 RETURNING *',
        [name, email, role, department, id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM employees WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const employee = result.rows[0];
    const isMatch = await bcrypt.compare(password, employee.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, department: employee.department } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
