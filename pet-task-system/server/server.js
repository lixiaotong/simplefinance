const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const petRoutes = require('./routes/pets');
const studentRoutes = require('./routes/students');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notifications', notificationRoutes);

// SPA fallback
app.use(function(req, res) {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, function() {
  console.log('Pet Task System running on http://localhost:' + PORT);
  console.log('Admin login: admin / admin123');
});
