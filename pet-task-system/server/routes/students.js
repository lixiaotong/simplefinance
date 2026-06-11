const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const students = db.prepare("SELECT u.id, u.username, u.nickname, u.avatar, s.* FROM users u JOIN students s ON u.id = s.user_id WHERE u.role = 'student' ORDER BY s.total_tasks_done DESC").all();
  res.json(students);
});

router.get('/stats/:id', authMiddleware, (req, res) => {
  const sid = req.params.id;
  const s = db.prepare('SELECT * FROM students WHERE user_id = ?').get(sid);
  if (!s) return res.status(404).json({ error: '学生不存在' });
  const tasks = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as done FROM tasks WHERE student_id=?").get(s.id);
  res.json({ ...s, taskStats: tasks });
});

module.exports = router;
