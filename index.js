const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible in routes
app.set('io', io);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/calls', require('./routes/calls'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/users', require('./routes/users'));
app.use('/api/best-plans', require('./routes/bestPlans'));
app.use('/api/quotes', require('./routes/quotes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('Insurance Backend API is running!');
});

// Example route to test database connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful',
      time: result.rows[0].now
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

server.listen(PORT, () => {
  console.log(`Server and WebSockets are running on port ${PORT}`);
});
